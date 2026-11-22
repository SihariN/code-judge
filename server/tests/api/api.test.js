const request = require("supertest");
const app = require("../../src/app");
const prisma = require("../../src/db");
const { submissionQueue } = require("../../src/queue/submissionQueue");
const { assertTestDatabase } = require("./config");

const PASSWORD = "supersecret123";
const auth = (token) => ({ Authorization: `Bearer ${token}` });

function register(name) {
  return request(app)
    .post("/api/auth/register")
    .send({ email: `${name}@example.com`, username: name, password: PASSWORD });
}

async function login(name) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: `${name}@example.com`, password: PASSWORD });
  return res.body.token;
}

const problemBody = (slug) => ({
  slug,
  title: "Double a number",
  description: "Read an integer and print it doubled.",
  difficulty: "EASY",
  testCases: [
    { input: "2\n", expectedOutput: "4", isSample: true },
    { input: "50\n", expectedOutput: "SECRET_OUTPUT_100", isSample: false },
  ],
});

let aliceToken;
let bobToken;
let adminToken;

beforeAll(async () => {
  assertTestDatabase(process.env.DATABASE_URL);
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Submission", "TestCase", "Problem", "User" RESTART IDENTITY CASCADE'
  );

  aliceToken = (await register("alice")).body.token;
  bobToken = (await register("bob")).body.token;

  await register("root");
  await prisma.user.update({ where: { username: "root" }, data: { role: "ADMIN" } });
  adminToken = await login("root"); // the role is baked into the token, so log in again
});

afterAll(async () => {
  await submissionQueue.obliterate({ force: true });
  await submissionQueue.close();
  await prisma.$disconnect();
});

describe("auth", () => {
  test("register returns a token and never exposes the password hash", async () => {
    const res = await register("carol");
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: "carol@example.com",
      username: "carol",
      role: "USER",
    });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  test("register lowercases the email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "Dave@Example.com", username: "dave", password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("dave@example.com");
  });

  test("register rejects a duplicate account", async () => {
    const res = await register("alice");
    expect(res.status).toBe(409);
  });

  test("register validates its input and names the bad fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "nope", username: "a b", password: "123" });
    expect(res.status).toBe(400);
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["email", "username", "password"]));
  });

  test("login fails with the same message for a wrong password and an unknown email", async () => {
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "wrong-password" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });

  test("/me needs a valid token", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    expect(
      (await request(app).get("/api/auth/me").set(auth("garbage"))).status
    ).toBe(401);

    const ok = await request(app).get("/api/auth/me").set(auth(aliceToken));
    expect(ok.status).toBe(200);
    expect(ok.body.user.username).toBe("alice");
  });
});

// These tests build on each other and run in order
describe("problems", () => {
  test("anyone can list problems", async () => {
    const res = await request(app).get("/api/problems");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.problems)).toBe(true);
  });

  test("creating a problem requires login", async () => {
    const res = await request(app).post("/api/problems").send(problemBody("double-a-number"));
    expect(res.status).toBe(401);
  });

  test("creating a problem requires the admin role", async () => {
    const res = await request(app)
      .post("/api/problems")
      .set(auth(aliceToken))
      .send(problemBody("double-a-number"));
    expect(res.status).toBe(403);
  });

  test("an admin can create a problem", async () => {
    const res = await request(app)
      .post("/api/problems")
      .set(auth(adminToken))
      .send(problemBody("double-a-number"));
    expect(res.status).toBe(201);
    expect(res.body.problem.slug).toBe("double-a-number");
  });

  test("duplicate slugs are rejected", async () => {
    const res = await request(app)
      .post("/api/problems")
      .set(auth(adminToken))
      .send(problemBody("double-a-number"));
    expect(res.status).toBe(409);
  });

  test("a problem needs at least one example test case", async () => {
    const body = problemBody("no-examples");
    body.testCases = body.testCases.map((t) => ({ ...t, isSample: false }));
    const res = await request(app)
      .post("/api/problems")
      .set(auth(adminToken))
      .send(body);
    expect(res.status).toBe(400);
  });

  test("hidden test cases are never leaked", async () => {
    const res = await request(app).get("/api/problems/double-a-number");
    expect(res.status).toBe(200);
    expect(res.body.problem.samples).toHaveLength(1);
    expect(JSON.stringify(res.body)).not.toContain("SECRET_OUTPUT");
  });

  test("an unknown problem is a 404", async () => {
    const res = await request(app).get("/api/problems/does-not-exist");
    expect(res.status).toBe(404);
  });

  test("deleting a problem also deletes its test cases", async () => {
    const created = await request(app)
      .post("/api/problems")
      .set(auth(adminToken))
      .send(problemBody("temporary-problem"));
    const id = created.body.problem.id;
    expect(await prisma.testCase.count({ where: { problemId: id } })).toBe(2);

    const deleted = await request(app)
      .delete("/api/problems/temporary-problem")
      .set(auth(adminToken));
    expect(deleted.status).toBe(204);
    expect(await prisma.testCase.count({ where: { problemId: id } })).toBe(0);

    const again = await request(app)
      .delete("/api/problems/temporary-problem")
      .set(auth(adminToken));
    expect(again.status).toBe(404);
  });
});

describe("submissions", () => {
  const code = "print(int(input()) * 2)";
  let submissionId;

  test("submitting requires login", async () => {
    const res = await request(app)
      .post("/api/problems/double-a-number/submit")
      .send({ code });
    expect(res.status).toBe(401);
  });

  test("empty code is rejected", async () => {
    const res = await request(app)
      .post("/api/problems/double-a-number/submit")
      .set(auth(aliceToken))
      .send({ code: "" });
    expect(res.status).toBe(400);
  });

  test("a submission is saved as PENDING and queued for the worker", async () => {
    const res = await request(app)
      .post("/api/problems/double-a-number/submit")
      .set(auth(aliceToken))
      .send({ code });

    expect(res.status).toBe(202);
    expect(res.body.submission.verdict).toBe("PENDING");
    submissionId = res.body.submission.id;

    const job = await submissionQueue.getJob(`submission-${submissionId}`);
    expect(job).toBeTruthy();
    expect(job.data).toEqual({ submissionId });
  });

  test("the owner can read their code", async () => {
    const res = await request(app)
      .get(`/api/submissions/${submissionId}`)
      .set(auth(aliceToken));
    expect(res.status).toBe(200);
    expect(res.body.submission.code).toBe(code);
  });

  test("another user gets a 404, not a 403", async () => {
    const res = await request(app)
      .get(`/api/submissions/${submissionId}`)
      .set(auth(bobToken));
    expect(res.status).toBe(404);
  });

  test("an admin can read any submission", async () => {
    const res = await request(app)
      .get(`/api/submissions/${submissionId}`)
      .set(auth(adminToken));
    expect(res.status).toBe(200);
  });

  test("the history only lists my own submissions", async () => {
    const res = await request(app).get("/api/submissions").set(auth(bobToken));
    expect(res.status).toBe(200);
    expect(res.body.submissions).toEqual([]);
  });
});

describe("leaderboard, stats and profiles", () => {
  beforeAll(async () => {
    const makeProblem = (slug) =>
      prisma.problem.create({
        data: {
          slug,
          title: slug,
          description: "placeholder description",
          difficulty: "EASY",
        },
      });
    const p1 = await makeProblem("rank-one");
    const p2 = await makeProblem("rank-two");
    const p3 = await makeProblem("rank-three");

    const alice = await prisma.user.findUnique({ where: { username: "alice" } });
    const bob = await prisma.user.findUnique({ where: { username: "bob" } });

    const add = (user, problem, verdict) =>
      prisma.submission.create({
        data: { userId: user.id, problemId: problem.id, verdict, code: "print(1)" },
      });

    // alice: solves rank-one (twice) and rank-two; bob: solves rank-one, fails rank-three
    await add(alice, p1, "ACCEPTED");
    await add(alice, p1, "ACCEPTED");
    await add(alice, p2, "ACCEPTED");
    await add(bob, p1, "ACCEPTED");
    await add(bob, p3, "WRONG_ANSWER");
  });

  test("the leaderboard ranks by distinct problems solved", async () => {
    const res = await request(app).get("/api/leaderboard");
    expect(res.status).toBe(200);

    const rows = res.body.leaderboard;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ username: "alice", solved: 2, rank: 1 });
    expect(rows[1]).toMatchObject({ username: "bob", solved: 1, rank: 2 });
  });

  test("the problem list shows solved, attempted and acceptance per user", async () => {
    const bySlug = (res) =>
      Object.fromEntries(res.body.problems.map((p) => [p.slug, p]));

    const forAlice = bySlug(
      await request(app).get("/api/problems").set(auth(aliceToken))
    );
    expect(forAlice["rank-one"]).toMatchObject({ status: "SOLVED", acceptance: 100 });
    expect(forAlice["rank-three"].status).toBeNull();

    const forBob = bySlug(
      await request(app).get("/api/problems").set(auth(bobToken))
    );
    expect(forBob["rank-three"]).toMatchObject({ status: "ATTEMPTED", acceptance: 0 });
    expect(forBob["rank-two"].status).toBeNull();
  });

  test("a bad token on the problem list is treated as anonymous, not an error", async () => {
    const res = await request(app).get("/api/problems").set(auth("garbage"));
    expect(res.status).toBe(200);
    expect(res.body.problems.every((p) => p.status === null)).toBe(true);
  });

  test("a profile shows stats but never private data", async () => {
    const res = await request(app).get("/api/users/alice");
    expect(res.status).toBe(200);
    expect(res.body.rank).toBe(1);
    expect(res.body.stats.solved).toBe(2);
    expect(res.body.activity).toHaveLength(30);

    const text = JSON.stringify(res.body);
    expect(text).not.toContain("alice@example.com");
    expect(text).not.toContain("passwordHash");
    expect(text).not.toContain("print(1)"); // submitted code stays private
  });

  test("an unknown user is a 404", async () => {
    const res = await request(app).get("/api/users/nobody-here");
    expect(res.status).toBe(404);
  });
});
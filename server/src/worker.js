require("dotenv").config();

const { Worker } = require("bullmq");
const prisma = require("./db");
const { QUEUE_NAME, createConnection } = require("./queue/config");
const { judgeSubmission } = require("./services/judge");
const { publishSubmissionEvent } = require("./events/publisher");

const concurrency = Number(process.env.WORKER_CONCURRENCY) || 2;

// Builds exactly what browsers receive. Never include the code or test cases.
function eventData(s, slug, overrides = {}) {
  return {
    id: s.id,
    problemSlug: slug,
    verdict: s.verdict,
    passedTests: s.passedTests,
    totalTests: s.totalTests,
    failedTest: s.failedTest ?? null,
    timeMs: s.timeMs,
    errorMessage: s.errorMessage ?? null,
    failure: s.failure ?? null,
    ...overrides,
  };
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { submissionId } = job.data;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        problem: {
          include: { testCases: { orderBy: { position: "asc" } } },
        },
      },
    });

    // The submission may have been deleted while it waited in the queue
    if (!submission) return;

    const { problem } = submission;
    const total = problem.testCases.length;

    // 1. Mark as JUDGING and tell the user
    const judging = await prisma.submission.update({
      where: { id: submissionId },
      data: { verdict: "JUDGING" },
    });
    await publishSubmissionEvent(
      submission.userId,
      eventData(judging, problem.slug, { passedTests: 0, totalTests: total })
    );

    // 2. Judge, reporting progress after every passed test case.
    //    Progress is only broadcast, not saved, to avoid a database write per test.
    const result = await judgeSubmission(
      submission.code,
      problem,
      problem.testCases,
      (passed, totalTests) =>
        publishSubmissionEvent(
          submission.userId,
          eventData(judging, problem.slug, {
            passedTests: passed,
            totalTests,
          })
        )
    );

    // 3. Save the final result and tell the user
    const done = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: result.verdict,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        failedTest: result.failedTest,
        timeMs: result.timeMs,
        errorMessage: result.errorMessage,
        failure: result.failure || undefined,
      },
    });
    await publishSubmissionEvent(
      submission.userId,
      eventData(done, problem.slug)
    );

    console.log(`Submission ${submissionId}: ${result.verdict}`);
  },
  { connection: createConnection({ worker: true }), concurrency }
);

worker.on("ready", () => {
  console.log(`Worker ready (concurrency ${concurrency})`);
});

worker.on("failed", async (job, err) => {
  console.error(`Job ${job && job.id} failed: ${err.message}`);

  // After the last retry, stop leaving the submission in limbo
  if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
    const s = await prisma.submission
      .update({
        where: { id: job.data.submissionId },
        data: {
          verdict: "INTERNAL_ERROR",
          errorMessage: "The judge failed, please submit again",
        },
        include: { problem: { select: { slug: true } } },
      })
      .catch(() => null);

    if (s) {
      await publishSubmissionEvent(s.userId, eventData(s, s.problem.slug));
    }
  }
});

worker.on("error", (err) => {
  console.error("Worker error:", err.message);
});

async function shutdown() {
  console.log("Shutting down worker...");
  await worker.close(); // finishes the job in progress
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
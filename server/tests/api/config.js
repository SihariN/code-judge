const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://judge:judge_dev_pw@localhost:5433/codejudge_test?schema=public";

// Safety net: tests delete data, so refuse to run on anything not named *_test
function assertTestDatabase(url) {
  const name = new URL(url).pathname.replace("/", "");
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests against database "${name}". The name must end with _test.`
    );
  }
}

module.exports = { TEST_DATABASE_URL, assertTestDatabase };
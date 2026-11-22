const { execSync } = require("child_process");
const path = require("path");
const { TEST_DATABASE_URL, assertTestDatabase } = require("./config");

module.exports = async () => {
  assertTestDatabase(TEST_DATABASE_URL);

  execSync("npx prisma migrate deploy", {
    cwd: path.join(__dirname, "..", ".."),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
};
const prisma = require("../db");

// Rank = number of problems solved (more is better). Ties are broken by who
// reached that score first. The tagged template (prisma.$queryRaw`...`) sends
// ${limit} as a parameter, so it can never be used for SQL injection.
// Never build SQL by joining strings together.
async function getLeaderboard(limit = 50) {
  return prisma.$queryRaw`
    WITH first_ac AS (
      SELECT "userId", "problemId", MIN("createdAt") AS solved_at
      FROM "Submission"
      WHERE verdict = 'ACCEPTED'
      GROUP BY "userId", "problemId"
    ),
    scores AS (
      SELECT "userId", COUNT(*)::int AS solved, MAX(solved_at) AS "lastSolvedAt"
      FROM first_ac
      GROUP BY "userId"
    )
    SELECT
      (RANK() OVER (ORDER BY s.solved DESC, s."lastSolvedAt" ASC))::int AS "rank",
      u.id AS "userId",
      u.username,
      s.solved,
      s."lastSolvedAt"
    FROM scores s
    JOIN "User" u ON u.id = s."userId"
    ORDER BY "rank", u.username
    LIMIT ${limit}
  `;
}

module.exports = { getLeaderboard };
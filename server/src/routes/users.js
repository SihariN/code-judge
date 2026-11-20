const router = require("express").Router();
const prisma = require("../db");
const { getLeaderboard } = require("../services/stats");

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const ACTIVITY_DAYS = 30;

// The last n calendar days (UTC) as "YYYY-MM-DD", oldest first
function lastDays(n) {
  const now = new Date();
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)
    );
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// GET /api/users/:username  (public profile; never includes email or code)
router.get("/:username", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: { id: true, username: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const [
      solvedRows,
      problemTotals,
      submissionCount,
      acceptedCount,
      activityRows,
      acceptedRecent,
      board,
    ] = await Promise.all([
      // distinct problems this user solved, grouped by difficulty
      prisma.$queryRaw`
        SELECT p.difficulty::text AS difficulty,
               COUNT(DISTINCT s."problemId")::int AS solved
        FROM "Submission" s
        JOIN "Problem" p ON p.id = s."problemId"
        WHERE s."userId" = ${user.id} AND s.verdict = 'ACCEPTED'
        GROUP BY p.difficulty
      `,
      prisma.problem.groupBy({ by: ["difficulty"], _count: { _all: true } }),
      prisma.submission.count({ where: { userId: user.id } }),
      prisma.submission.count({ where: { userId: user.id, verdict: "ACCEPTED" } }),
      // submissions per day over the last 30 days
      prisma.$queryRaw`
        SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count
        FROM "Submission"
        WHERE "userId" = ${user.id}
          AND "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.submission.findMany({
        where: { userId: user.id, verdict: "ACCEPTED" },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          createdAt: true,
          problem: { select: { slug: true, title: true, difficulty: true } },
        },
      }),
      getLeaderboard(1000),
    ]);

    // Solved vs total, per difficulty
    const byDifficulty = {};
    for (const d of DIFFICULTIES) {
      const total = problemTotals.find((r) => r.difficulty === d);
      const solved = solvedRows.find((r) => r.difficulty === d);
      byDifficulty[d] = {
        solved: solved ? solved.solved : 0,
        total: total ? total._count._all : 0,
      };
    }
    const solved = DIFFICULTIES.reduce((sum, d) => sum + byDifficulty[d].solved, 0);
    const totalProblems = DIFFICULTIES.reduce((sum, d) => sum + byDifficulty[d].total, 0);

    // A row for every one of the last 30 days, including days with no activity
    const counts = new Map(activityRows.map((r) => [r.day, r.count]));
    const activity = lastDays(ACTIVITY_DAYS).map((day) => ({
      day,
      count: counts.get(day) || 0,
    }));

    // Recently solved: first 5 distinct problems from newest accepted submissions
    const seen = new Set();
    const recentSolved = [];
    for (const row of acceptedRecent) {
      if (seen.has(row.problem.slug)) continue;
      seen.add(row.problem.slug);
      recentSolved.push({ ...row.problem, solvedAt: row.createdAt });
      if (recentSolved.length === 5) break;
    }

    const entry = board.find((r) => r.userId === user.id);

    res.json({
      user: { username: user.username, joinedAt: user.createdAt },
      rank: entry ? entry.rank : null,
      stats: {
        solved,
        totalProblems,
        byDifficulty,
        submissions: submissionCount,
        accepted: acceptedCount,
        acceptance:
          submissionCount > 0
            ? Math.round((acceptedCount / submissionCount) * 100)
            : null,
      },
      activity,
      recentSolved,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
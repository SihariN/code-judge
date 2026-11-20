const router = require("express").Router();
const { getLeaderboard } = require("../services/stats");

// GET /api/leaderboard?limit=50
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const leaderboard = await getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
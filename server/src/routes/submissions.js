const router = require("express").Router();

const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { publicSubmission } = require("../utils/submissions");

const withProblem = { problem: { select: { slug: true, title: true } } };

// GET /api/submissions?problem=a-plus-b&limit=20  (your own submissions)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const where = { userId: req.user.id };
    if (req.query.problem) where.problem = { slug: String(req.query.problem) };

    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: withProblem,
    });

    res.json({ submissions: submissions.map(publicSubmission) });
  } catch (err) {
    next(err);
  }
});

// GET /api/submissions/:id  (owner or admin; includes the code)
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid submission id" });
    }

    const s = await prisma.submission.findUnique({
      where: { id },
      include: withProblem,
    });

    // Same 404 whether it doesn't exist or isn't yours, so ids can't be probed
    if (!s || (s.userId !== req.user.id && req.user.role !== "ADMIN")) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json({ submission: { ...publicSubmission(s), code: s.code } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
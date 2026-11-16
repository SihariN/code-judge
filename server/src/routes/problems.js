const router = require("express").Router();
const { z } = require("zod");

const prisma = require("../db");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

const rateLimit = require("express-rate-limit");
const { submissionQueue } = require("../queue/submissionQueue");
const { publicSubmission } = require("../utils/submissions");

const { publishSubmissionEvent } = require("../events/publisher");

const testCaseSchema = z.object({
  input: z.string().max(10000),
  expectedOutput: z.string().max(10000),
  isSample: z.boolean().default(false),
});

const problemSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(60)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers and single hyphens"
      ),
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().min(10).max(20000),
    difficulty: z.enum(DIFFICULTIES),
    timeLimitMs: z.number().int().min(500).max(10000).default(2000),
    memoryLimitMb: z.number().int().min(16).max(512).default(128),
    testCases: z.array(testCaseSchema).min(1).max(50),
  })
  .refine((p) => p.testCases.some((t) => t.isSample), {
    message: "At least one sample test case is required",
    path: ["testCases"],
  });

// GET /api/problems?difficulty=easy
router.get("/", async (req, res, next) => {
  try {
    const where = {};
    if (req.query.difficulty) {
      const d = String(req.query.difficulty).toUpperCase();
      if (DIFFICULTIES.includes(d)) where.difficulty = d;
    }

    const problems = await prisma.problem.findMany({
      where,
      orderBy: { id: "asc" },
      select: { id: true, slug: true, title: true, difficulty: true },
    });

    res.json({ problems });
  } catch (err) {
    next(err);
  }
});

// GET /api/problems/:slug  (only sample test cases are exposed)
router.get("/:slug", async (req, res, next) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { slug: req.params.slug },
      include: {
        testCases: {
          where: { isSample: true },
          orderBy: { position: "asc" },
          select: { input: true, expectedOutput: true },
        },
      },
    });

    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const { testCases, ...rest } = problem;
    res.json({ problem: { ...rest, samples: testCases } });
  } catch (err) {
    next(err);
  }
});

// POST /api/problems  (admin only)
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate(problemSchema),
  async (req, res, next) => {
    try {
      const { testCases, ...data } = req.body;

      const problem = await prisma.problem.create({
        data: {
          ...data,
          testCases: {
            create: testCases.map((t, i) => ({ ...t, position: i })),
          },
        },
        select: { id: true, slug: true, title: true, difficulty: true },
      });

      res.status(201).json({ problem });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "A problem with this slug exists" });
      }
      next(err);
    }
  }
);

// DELETE /api/problems/:slug  (admin only)
router.delete(
  "/:slug",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      await prisma.problem.delete({ where: { slug: req.params.slug } });
      res.status(204).end();
    } catch (err) {
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Problem not found" });
      }
      next(err);
    }
  }
);

const submitSchema = z.object({
  language: z.enum(["python"]).default("python"),
  code: z.string().min(1, "Code cannot be empty").max(50000),
});

// 10 submissions per minute per user
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => String(req.user.id),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions, please slow down" },
});

// POST /api/problems/:slug/submit
router.post(
  "/:slug/submit",
  requireAuth,
  submitLimiter,
  validate(submitSchema),
  async (req, res, next) => {
    try {
      const problem = await prisma.problem.findUnique({
        where: { slug: req.params.slug },
        select: { id: true, _count: { select: { testCases: true } } },
      });
      if (!problem) return res.status(404).json({ error: "Problem not found" });

      const { language, code } = req.body;

      // 1. Record the submission immediately as PENDING
      const submission = await prisma.submission.create({
        data: {
          userId: req.user.id,
          problemId: problem.id,
          language,
          code,
          verdict: "PENDING",
          totalTests: problem._count.testCases,
        },
      });

      // 2. Put a job on the queue for the worker to pick up
      try {
        await submissionQueue.add(
          "judge",
          { submissionId: submission.id },
          { jobId: `submission-${submission.id}` }
        );
      } catch (queueErr) {
        console.error("Could not enqueue submission:", queueErr.message);
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            verdict: "INTERNAL_ERROR",
            errorMessage: "The judge queue is unavailable",
          },
        });
        return res
          .status(503)
          .json({ error: "The judge is unavailable, please try again later" });
      }

      // Tell the user's other open tabs about the new submission
      publishSubmissionEvent(req.user.id, {
        id: submission.id,
        problemSlug: req.params.slug,
        verdict: "PENDING",
        passedTests: 0,
        totalTests: submission.totalTests,
        failedTest: null,
        timeMs: 0,
        errorMessage: null,
        failure: null,
      });
      
      // 3. Respond right away. 202 means "accepted, still being processed"
      res.status(202).json({ submission: publicSubmission(submission) });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;


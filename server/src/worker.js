require("dotenv").config();

const { Worker } = require("bullmq");
const prisma = require("./db");
const { QUEUE_NAME, createConnection } = require("./queue/config");
const { judgeSubmission } = require("./services/judge");

const concurrency = Number(process.env.WORKER_CONCURRENCY) || 2;

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

    await prisma.submission.update({
      where: { id: submissionId },
      data: { verdict: "JUDGING" },
    });

    const { problem } = submission;
    const result = await judgeSubmission(
      submission.code,
      problem,
      problem.testCases
    );

    await prisma.submission.update({
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
    await prisma.submission
      .update({
        where: { id: job.data.submissionId },
        data: {
          verdict: "INTERNAL_ERROR",
          errorMessage: "The judge failed, please submit again",
        },
      })
      .catch(() => {});
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
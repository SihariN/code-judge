const { Queue } = require("bullmq");
const { QUEUE_NAME, createConnection } = require("./config");

const submissionQueue = new Queue(QUEUE_NAME, {
  connection: createConnection(),
  defaultJobOptions: {
    attempts: 3, // try up to 3 times if the worker throws
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000, // keep only the last 1000 finished jobs in Redis
    removeOnFail: 1000,
  },
});

module.exports = { submissionQueue };
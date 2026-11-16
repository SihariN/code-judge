const IORedis = require("ioredis");

const QUEUE_NAME = "submissions";

// BullMQ workers need maxRetriesPerRequest set to null
function createConnection({ worker = false } = {}) {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  return new IORedis(url, worker ? { maxRetriesPerRequest: null } : {});
}

module.exports = { QUEUE_NAME, createConnection };
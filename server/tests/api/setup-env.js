const { TEST_DATABASE_URL } = require("./config");

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = "test-secret-not-for-production";
process.env.REDIS_URL = process.env.TEST_REDIS_URL || "redis://localhost:6379";
process.env.QUEUE_NAME = "submissions-test"; // a different queue from the real one
process.env.EVENT_CHANNEL = "submission-events-test"; // a different channel too
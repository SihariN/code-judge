const { createConnection } = require("../queue/config");

const CHANNEL = process.env.EVENT_CHANNEL || "submission-events";

const publisher = createConnection();
publisher.on("error", (err) => console.error("Event publisher:", err.message));

// event data = what the browser receives. Never put code or test cases in it.
async function publishSubmissionEvent(userId, data) {
  try {
    await publisher.publish(CHANNEL, JSON.stringify({ userId, data }));
  } catch (err) {
    // Live updates are a bonus; judging must never fail because of them
    console.error("Could not publish event:", err.message);
  }
}

module.exports = { CHANNEL, publishSubmissionEvent };
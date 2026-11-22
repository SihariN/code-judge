const { runPython } = require("../../../judge/runner");

// Starting a container costs time we don't want to blame on the user's code.
// Temporary: later we'll measure time inside the container instead.
const STARTUP_GRACE_MS = 1500;

// At most this many submissions are judged at the same time
const MAX_CONCURRENT = 2;

let running = 0;
const waiting = [];

async function acquire() {
  if (running < MAX_CONCURRENT) {
    running++;
    return;
  }
  await new Promise((resolve) => waiting.push(resolve));
}

function release() {
  const next = waiting.shift();
  if (next) next(); // hand our slot straight to the next waiting submission
  else running--;
}

// Forgive trailing spaces and blank lines, like real judges do
function normalize(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

// Returns a verdict string, or null if this test case passed
function classify(result, testCase) {
  if (result.exitCode === 125) return "INTERNAL_ERROR"; // docker itself failed
  if (result.timedOut) return "TIME_LIMIT_EXCEEDED";
  if (result.outputTooLarge) return "OUTPUT_LIMIT_EXCEEDED";
  if (result.memoryExceeded) return "MEMORY_LIMIT_EXCEEDED";
  if (result.exitCode !== 0) return "RUNTIME_ERROR";
  if (normalize(result.stdout) !== normalize(testCase.expectedOutput)) {
    return "WRONG_ANSWER";
  }
  return null;
}

// onProgress(passedSoFar, total) is optional; it's called after each passed test
async function judgeSubmission(code, problem, testCases, onProgress) {
  await acquire();
  try {
    let maxTimeMs = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      const result = await runPython(
        code,
        tc.input,
        problem.timeLimitMs + STARTUP_GRACE_MS,
        problem.memoryLimitMb
      );
      maxTimeMs = Math.max(maxTimeMs, result.timeMs);

      const verdict = classify(result, tc);
      if (verdict) {
        if (verdict === "INTERNAL_ERROR") console.error(result.stderr);

        return {
          verdict,
          passedTests: i,
          totalTests: testCases.length,
          failedTest: i + 1,
          timeMs: maxTimeMs,
          errorMessage:
            verdict === "INTERNAL_ERROR"
              ? "The judge is unavailable, please try again later"
              : result.stderr
              ? result.stderr.slice(-1000)
              : null,
          // Only reveal details for sample cases, never hidden ones
          failure: tc.isSample
            ? {
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: result.stdout.slice(0, 2000),
              }
            : null,
        };
      }

      if (onProgress) await onProgress(i + 1, testCases.length);
    }

    return {
      verdict: "ACCEPTED",
      passedTests: testCases.length,
      totalTests: testCases.length,
      failedTest: null,
      timeMs: maxTimeMs,
      errorMessage: null,
      failure: null,
    };
  } finally {
    release();
  }
}

module.exports = { judgeSubmission, normalize, classify };
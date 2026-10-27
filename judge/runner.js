const { spawn, execFile } = require("child_process");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const MAX_OUTPUT_BYTES = 64 * 1024;

async function runPython(code, input = "", timeLimitMs = 5000) {
  // 1. Put the submitted code in a temp folder we can mount into the container
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "judge-"));
  await fs.writeFile(path.join(dir, "main.py"), code);

  // 2. Give the container a unique name so we can kill it on timeout
  const name = "judge-" + crypto.randomBytes(6).toString("hex");

  const args = [
    "run", "--rm", "-i",
    "--name", name,
    "--network", "none",              // no internet
    "--memory", "128m",               // RAM cap
    "--memory-swap", "128m",          // no swap, so the cap is real
    "--cpus", "0.5",                  // half a CPU core
    "--pids-limit", "64",             // stops fork bombs
    "--read-only",                    // container filesystem is read-only
    "--cap-drop", "ALL",              // drop all Linux privileges
    "--security-opt", "no-new-privileges",
    "-e", "PYTHONDONTWRITEBYTECODE=1",
    "-v", `${dir}:/sandbox:ro`,       // code is mounted read-only
    "python:3.12-slim",
    "python", "/sandbox/main.py",
  ];

  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn("docker", args);

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let outputTooLarge = false;

    // Kill the container if it runs too long
    const timer = setTimeout(() => {
      timedOut = true;
      execFile("docker", ["kill", name], () => {});
    }, timeLimitMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > MAX_OUTPUT_BYTES) {
        outputTooLarge = true;
        stdout = stdout.slice(0, MAX_OUTPUT_BYTES);
        execFile("docker", ["kill", name], () => {});
      }
    });
    child.stderr.on("data", (chunk) => {
      if (stderr.length < MAX_OUTPUT_BYTES) stderr += chunk;
    });

    // Feed the test input into the program's stdin
    child.stdin.on("error", () => {});
    child.stdin.end(input);

    child.on("close", async (exitCode) => {
      clearTimeout(timer);
      await fs.rm(dir, { recursive: true, force: true });
      resolve({
        stdout,
        stderr,
        exitCode,
        timedOut,
        outputTooLarge,
        // 137 = killed (usually out of memory)
        memoryExceeded: exitCode === 137 && !timedOut && !outputTooLarge,
        timeMs: Date.now() - start,
      });
    });
  });
}

module.exports = { runPython };
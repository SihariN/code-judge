const { runPython } = require("./runner");

const cases = [
  {
    name: "Hello world",
    code: `print("hello from the sandbox")`,
  },
  {
    name: "Reads stdin",
    code: `a, b = map(int, input().split())\nprint(a + b)`,
    input: "3 4\n",
  },
  {
    name: "Syntax error",
    code: `print("oops"`,
  },
  {
    name: "Infinite loop (should time out)",
    code: `while True:\n    pass`,
    timeLimitMs: 3000,
  },
  {
    name: "Memory bomb (should be killed)",
    code: `x = "a" * (10**9)\nprint(len(x))`,
  },
  {
    name: "Network attempt (should fail)",
    code: `import urllib.request\nprint(urllib.request.urlopen("http://example.com").read())`,
  },
  {
    name: "Write to filesystem (should fail)",
    code: `open("/hack.txt", "w").write("pwned")`,
  },
  {
    name: "Fork bomb (should be contained)",
    code: `import os\nwhile True:\n    os.fork()`,
    timeLimitMs: 4000,
  },
];

(async () => {
  for (const c of cases) {
    console.log(`\n=== ${c.name} ===`);
    const r = await runPython(c.code, c.input || "", c.timeLimitMs);
    console.log({
      stdout: r.stdout.trim().slice(0, 200),
      stderr: r.stderr.trim().split("\n").slice(-1)[0],
      exitCode: r.exitCode,
      timedOut: r.timedOut,
      memoryExceeded: r.memoryExceeded,
      timeMs: r.timeMs,
    });
  }
})();
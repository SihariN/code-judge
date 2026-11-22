const { runPython } = require("../../../judge/runner");

describe("python sandbox", () => {
  test("runs code and captures its output", async () => {
    const r = await runPython('print("hello from the sandbox")');
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe("hello from the sandbox");
  });

  test("feeds the test input to stdin", async () => {
    const r = await runPython("a, b = map(int, input().split())\nprint(a + b)", "3 4\n");
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe("7");
  });

  test("reports a syntax error as a failed run", async () => {
    const r = await runPython('print("oops"');
    expect(r.exitCode).not.toBe(0);
    expect(r.stderr).toMatch(/SyntaxError/);
  });

  test("runs as an unprivileged user, not root", async () => {
    const r = await runPython("import os\nprint(os.getuid())");
    expect(r.stdout.trim()).toBe("65534");
  });

  test("kills an infinite loop at the time limit", async () => {
    const r = await runPython("while True:\n    pass", "", 2000);
    expect(r.timedOut).toBe(true);
    expect(r.timeMs).toBeLessThan(10000);
  });

  test("stops a program that uses too much memory", async () => {
    const r = await runPython('x = "a" * (10**9)\nprint(len(x))');
    expect(r.memoryExceeded || /MemoryError/.test(r.stderr)).toBe(true);
  });

  test("stops a program that prints endlessly", async () => {
    const r = await runPython('while True:\n    print("x" * 1000)', "", 5000);
    expect(r.outputTooLarge).toBe(true);
  });

  test("has no network access", async () => {
    const code = [
      "import urllib.request",
      'urllib.request.urlopen("http://example.com", timeout=3)',
    ].join("\n");
    const r = await runPython(code, "", 10000);
    expect(r.exitCode).not.toBe(0);
    expect(r.stderr).toMatch(/URLError|unreachable|resolution|resolve/i);
  });

  test("cannot write to the filesystem", async () => {
    const r = await runPython('open("/hack.txt", "w").write("pwned")');
    expect(r.exitCode).not.toBe(0);
    expect(r.stderr).toMatch(/Read-only file system|Permission denied/i);
  });
});
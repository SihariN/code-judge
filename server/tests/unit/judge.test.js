const { normalize, classify } = require("../../src/services/judge");

describe("normalize", () => {
  test("ignores trailing spaces and trailing blank lines", () => {
    expect(normalize("7   \n\n")).toBe("7");
  });

  test("treats Windows and Unix line endings the same", () => {
    expect(normalize("1\r\n2\r\n")).toBe(normalize("1\n2\n"));
  });

  test("keeps spaces inside a line", () => {
    expect(normalize("a  b")).toBe("a  b");
  });

  test("does not hide a real difference", () => {
    expect(normalize("1\n2")).not.toBe(normalize("1 2"));
  });
});

describe("classify", () => {
  const passing = {
    exitCode: 0,
    stdout: "7\n",
    stderr: "",
    timedOut: false,
    outputTooLarge: false,
    memoryExceeded: false,
  };
  const testCase = { expectedOutput: "7" };
  const verdictFor = (changes) => classify({ ...passing, ...changes }, testCase);

  test("passes when the output matches", () => {
    expect(verdictFor({})).toBeNull();
  });

  test("passes despite extra trailing newlines", () => {
    expect(verdictFor({ stdout: "7\n\n" })).toBeNull();
  });

  test("wrong answer when the output differs", () => {
    expect(verdictFor({ stdout: "8\n" })).toBe("WRONG_ANSWER");
  });

  test("runtime error when the program exits with an error", () => {
    expect(verdictFor({ exitCode: 1, stderr: "Traceback..." })).toBe("RUNTIME_ERROR");
  });

  test("a crash is never accepted, even if the output looked right", () => {
    expect(verdictFor({ exitCode: 1, stdout: "7\n" })).toBe("RUNTIME_ERROR");
  });

  test("time limit wins over everything else", () => {
    expect(verdictFor({ timedOut: true, exitCode: 137 })).toBe("TIME_LIMIT_EXCEEDED");
  });

  test("memory limit", () => {
    expect(verdictFor({ memoryExceeded: true, exitCode: 137 })).toBe(
      "MEMORY_LIMIT_EXCEEDED"
    );
  });

  test("output limit", () => {
    expect(verdictFor({ outputTooLarge: true, exitCode: 137 })).toBe(
      "OUTPUT_LIMIT_EXCEEDED"
    );
  });

  test("a Docker failure is an internal error, not the user's fault", () => {
    expect(verdictFor({ exitCode: 125 })).toBe("INTERNAL_ERROR");
  });
});
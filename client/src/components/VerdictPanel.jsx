import { VerdictBadge } from "./Badges";

function Box({ children }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      {children}
    </div>
  );
}

function Block({ label, text }) {
  return (
    <div>
      <div className="mb-1 text-xs uppercase text-slate-400">{label}</div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 text-sm">
        {text === "" ? "(empty)" : text}
      </pre>
    </div>
  );
}

export default function VerdictPanel({ submission }) {
  if (!submission) {
    return (
      <Box>
        <p className="text-sm text-slate-400">
          Submit your code to see the result here. Tip: Ctrl + Enter submits.
        </p>
      </Box>
    );
  }

  const { verdict, passedTests, totalTests, failedTest, timeMs, errorMessage, failure } =
    submission;

  if (verdict === "PENDING") {
    return (
      <Box>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
          <span className="text-slate-300">In the queue...</span>
        </div>
      </Box>
    );
  }

  if (verdict === "JUDGING") {
    const percent = totalTests ? Math.round((passedTests / totalTests) * 100) : 0;
    return (
      <Box>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-sky-300">Judging...</span>
          <span className="text-slate-400">
            {passedTests}/{totalTests} tests passed
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-sky-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </Box>
    );
  }

  const accepted = verdict === "ACCEPTED";

  return (
    <Box>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <VerdictBadge verdict={verdict} />
        <span className="text-sm text-slate-400">
          {passedTests}/{totalTests} tests passed · {timeMs} ms
        </span>
      </div>

      {accepted && (
        <p className="text-emerald-300">All {totalTests} test cases passed. Nice work!</p>
      )}

      {!accepted && failedTest && !failure && (
        <p className="mb-3 text-sm text-slate-300">
          Failed on test case {failedTest}. Hidden test cases are never revealed.
        </p>
      )}

      {failure && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Failed on test case {failedTest} (one of the examples):
          </p>
          <Block label="Input" text={failure.input} />
          <Block label="Expected output" text={failure.expectedOutput} />
          <Block label="Your output" text={failure.actualOutput} />
        </div>
      )}

      {errorMessage && (
        <div className="mt-3">
          <Block label="Error output" text={errorMessage} />
        </div>
      )}
    </Box>
  );
}
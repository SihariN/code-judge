
import { VerdictBadge } from "./Badges";

function Box({ children, accent = "border-slate-800" }) {
  return (
    <div
      className={`rounded-xl border ${accent} bg-slate-900 p-4`}
    >
      {children}
    </div>
  );
}

function Block({ label, text }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
        {text === "" ? "(empty)" : text}
      </pre>
    </div>
  );
}

export default function VerdictPanel({ submission }) {
  if (!submission) {
    return (
      <Box>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
            &gt;_
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Ready to evaluate
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Submit your solution to see the verdict and test results.
              You can also use Ctrl + Enter.
            </p>
          </div>
        </div>
      </Box>
    );
  }

  const {
    verdict,
    passedTests,
    totalTests,
    failedTest,
    timeMs,
    errorMessage,
    failure,
  } = submission;

  if (verdict === "PENDING") {
    return (
      <Box accent="border-sky-500/20">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-sky-400" />
          <div>
            <h3 className="text-sm font-semibold text-sky-300">
              Waiting in queue
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Your submission is waiting for a judge worker.
            </p>
          </div>
        </div>
      </Box>
    );
  }

  if (verdict === "JUDGING") {
    const percent = totalTests
      ? Math.round((passedTests / totalTests) * 100)
      : 0;

    return (
      <Box accent="border-sky-500/20">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-sky-300">
              Evaluating your solution
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Running test cases...
            </p>
          </div>
          <span className="text-sm font-medium tabular-nums text-slate-300">
            {passedTests}/{totalTests}
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Test cases passed"
        >
          <div
            className="h-full rounded-full bg-sky-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </Box>
    );
  }

  const accepted = verdict === "ACCEPTED";

  return (
    <Box
      accent={
        accepted
          ? "border-emerald-500/30"
          : "border-red-500/20"
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Submission result
          </p>
          <VerdictBadge verdict={verdict} />
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-white">
            {passedTests}/{totalTests}
          </p>
          <p className="text-xs text-slate-400">Tests passed</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-950/70 p-3">
          <p className="text-xs text-slate-500">Execution time</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">
            {timeMs} ms
          </p>
        </div>

        <div className="rounded-lg bg-slate-950/70 p-3">
          <p className="text-xs text-slate-500">Test cases</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">
            {passedTests} / {totalTests}
          </p>
        </div>
      </div>

      {accepted && (
        <div className="rounded-lg bg-emerald-500/10 p-3">
          <p className="text-sm font-medium text-emerald-300">
            All {totalTests} test cases passed. Nice work!
          </p>
        </div>
      )}

      {!accepted && failedTest && !failure && (
        <div className="rounded-lg bg-red-500/10 p-3">
          <p className="text-sm text-red-300">
            Failed on test case {failedTest}.
            Hidden test cases are never revealed.
          </p>
        </div>
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
        <div className="mt-4">
          <Block label="Error output" text={errorMessage} />
        </div>
      )}
    </Box>
  );
}

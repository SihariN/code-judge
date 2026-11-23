
import { VerdictBadge } from "./Badges";

export default function SubmissionHistory({
  submissions,
  activeId,
  onSelect,
}) {
  if (submissions.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Submission history
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Your recent attempts for this problem
          </p>
        </div>

        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
          {submissions.length}
        </span>
      </div>

      <ul className="divide-y divide-slate-800">
        {submissions.map((s) => {
          const selected = s.id === activeId;

          return (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s)}
                aria-pressed={selected}
                className={`flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition ${
                  selected
                    ? "bg-indigo-500/10"
                    : "hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-1 rounded-full ${
                      selected ? "bg-indigo-400" : "bg-transparent"
                    }`}
                  />

                  <div>
                    <VerdictBadge verdict={s.verdict} />
                    <p className="mt-1 text-xs text-slate-500">
                      Submission #{s.id}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium tabular-nums text-slate-300">
                    {s.passedTests}/{s.totalTests} tests · {s.timeMs} ms
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

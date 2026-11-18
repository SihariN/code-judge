import { VerdictBadge } from "./Badges";

export default function SubmissionHistory({ submissions, activeId, onSelect }) {
  if (submissions.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Your submissions
      </h3>
      <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900 text-sm">
        {submissions.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s)}
              className={
                "flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-800/60 " +
                (s.id === activeId ? "bg-slate-800/60" : "")
              }
            >
              <VerdictBadge verdict={s.verdict} />
              <span className="text-slate-400">
                {s.passedTests}/{s.totalTests} · {s.timeMs} ms ·{" "}
                {new Date(s.createdAt).toLocaleTimeString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
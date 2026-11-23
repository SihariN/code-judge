
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { DifficultyBadge } from "../components/Badges";

const FILTERS = ["ALL", "EASY", "MEDIUM", "HARD"];

function StatusMark({ status }) {
  if (status === "SOLVED") {
    return (
      <span
        title="Solved"
        aria-label="Solved"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-400"
      >
        ✓
      </span>
    );
  }

  if (status === "ATTEMPTED") {
    return (
      <span
        title="Attempted, not solved yet"
        aria-label="Attempted"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-xs text-amber-400"
      >
        ●
      </span>
    );
  }

  return (
    <span
      className="flex h-7 w-7 items-center justify-center text-slate-600"
      aria-label="Not attempted"
    >
      —
    </span>
  );
}

export default function ProblemsPage() {
  const [filter, setFilter] = useState("ALL");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    const query = filter === "ALL" ? "" : `?difficulty=${filter}`;

    api(`/problems${query}`)
      .then((data) => {
        if (!cancelled) setProblems(data.problems);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">
          Code Judge
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Explore Problems
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Sharpen your problem-solving skills, one challenge at a time.
          Choose a problem and put your coding skills to the test.
        </p>
      </div>

      {/* Difficulty filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const selected = filter === f;

          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={selected}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-950/30"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {f === "ALL" ? "All problems" : f[0] + f.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Problems list */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Problem set
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Browse available coding challenges
            </p>
          </div>

          {!loading && !error && (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
              {problems.length} problems
            </span>
          )}
        </div>

        {/* Column headings */}
        <div className="grid grid-cols-[minmax(0,1fr)_76px_88px] items-center gap-3 border-b border-slate-800 bg-slate-950/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid-cols-[minmax(0,1fr)_100px_100px]">
          <span>Problem</span>
          <span className="text-right">Acceptance</span>
          <span className="text-right">Difficulty</span>
        </div>

        {loading && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            Loading problems...
          </p>
        )}

        {error && (
          <p className="m-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && problems.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            No problems found for this difficulty.
          </p>
        )}

        {!loading && !error && problems.length > 0 && (
          <ul className="divide-y divide-slate-800">
            {problems.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/problems/${p.slug}`}
                  className="grid grid-cols-[minmax(0,1fr)_76px_88px] items-center gap-3 px-4 py-4 transition hover:bg-slate-800/50 sm:grid-cols-[minmax(0,1fr)_100px_100px]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <StatusMark status={p.status} />
                    <span className="truncate text-sm font-medium text-slate-200 transition group-hover:text-white">
                      {p.title}
                    </span>
                  </span>

                  <span className="text-right text-xs tabular-nums text-slate-400 sm:text-sm">
                    {p.acceptance === null ? "-" : `${p.acceptance}%`}
                  </span>

                  <span className="flex justify-end">
                    <DifficultyBadge difficulty={p.difficulty} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400">✓</span>
          Solved
        </span>

        <span className="flex items-center gap-2">
          <span className="text-amber-400">●</span>
          Attempted
        </span>

        <span>Acceptance rate shows the percentage of accepted submissions.</span>
      </div>
    </div>
  );
}

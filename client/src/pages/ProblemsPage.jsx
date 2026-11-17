import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { DifficultyBadge } from "../components/Badges";

const FILTERS = ["ALL", "EASY", "MEDIUM", "HARD"];

export default function ProblemsPage() {
  const [filter, setFilter] = useState("ALL");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // If the filter changes while a request is in flight, ignore the old answer
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Problems</h1>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-md px-3 py-1 text-sm " +
                (filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700")
              }
            >
              {f === "ALL" ? "All" : f[0] + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-slate-400">Loading...</p>}
      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-red-300">{error}</p>
      )}

      {!loading && !error && problems.length === 0 && (
        <p className="text-slate-400">No problems found.</p>
      )}

      <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
        {problems.map((p) => (
          <li key={p.id}>
            <Link
              to={`/problems/${p.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/60"
            >
              <span className="font-medium">{p.title}</span>
              <DifficultyBadge difficulty={p.difficulty} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const rankStyles = {
  1: "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20",
  2: "bg-slate-300/10 text-slate-300 ring-1 ring-slate-300/20",
  3: "bg-orange-400/10 text-orange-300 ring-1 ring-orange-400/20",
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api("/leaderboard?limit=50")
      .then((data) => {
        if (!cancelled) setRows(data.leaderboard);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <h2 className="font-semibold text-red-300">
          Couldn't load the leaderboard
        </h2>
        <p className="mt-1 text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
        <p className="text-sm text-slate-400">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-indigo-400">
          COMMUNITY
        </p>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Leaderboard
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              See how you rank against other problem solvers. Every accepted
              solution brings you closer to the top.
            </p>
          </div>

          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400">
            Top 50
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-14 text-center">
          <div className="mb-3 text-3xl text-slate-500">#</div>
          <h2 className="font-semibold text-slate-200">
            The leaderboard is waiting
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            No one has solved a problem yet. Be the first!
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Explore problems
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-100">
                Top problem solvers
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Ranked by accepted problems
              </p>
            </div>

            <span className="text-xs text-slate-500">
              {rows.length} {rows.length === 1 ? "participant" : "participants"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-24 px-5 py-3 font-semibold">Rank</th>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Solved
                  </th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Last solved
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {rows.map((r) => {
                  const isMe = user && user.username === r.username;
                  const rankStyle =
                    rankStyles[r.rank] ??
                    "bg-slate-800 text-slate-300";

                  return (
                    <tr
                      key={r.userId}
                      className={`transition-colors ${
                        isMe
                          ? "bg-indigo-500/10 hover:bg-indigo-500/15"
                          : "hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-bold tabular-nums ${rankStyle}`}
                        >
                          {r.rank}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/users/${r.username}`}
                            className="font-medium text-slate-200 transition hover:text-indigo-300"
                          >
                            {r.username}
                          </Link>

                          {isMe && (
                            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="font-semibold tabular-nums text-slate-200">
                          {r.solved}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-slate-400">
                        {r.lastSolvedAt
                          ? new Date(r.lastSolvedAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-800 px-5 py-3">
            <p className="text-xs text-slate-500">
              Ties go to whoever reached that score first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

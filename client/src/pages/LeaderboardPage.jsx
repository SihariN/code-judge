import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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

  if (error) return <p className="text-red-300">{error}</p>;
  if (!rows) return <p className="text-slate-400">Loading...</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">Leaderboard</h1>
      <p className="mb-6 text-sm text-slate-400">
        Ranked by problems solved. Ties go to whoever reached that score first.
      </p>

      {rows.length === 0 ? (
        <p className="text-slate-400">No one has solved a problem yet. Be the first!</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="w-16 px-4 py-2 font-medium">Rank</th>
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Solved</th>
                <th className="px-4 py-2 font-medium">Last solved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r) => {
                const isMe = user && user.username === r.username;
                return (
                  <tr
                    key={r.userId}
                    className={isMe ? "bg-indigo-500/10" : "hover:bg-slate-900/60"}
                  >
                    <td className="px-4 py-2 font-semibold text-slate-300">
                      {r.rank}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/users/${r.username}`}
                        className="text-indigo-400 hover:underline"
                      >
                        {r.username}
                      </Link>
                      {isMe && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                    </td>
                    <td className="px-4 py-2">{r.solved}</td>
                    <td className="px-4 py-2 text-slate-400">
                      {new Date(r.lastSolvedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
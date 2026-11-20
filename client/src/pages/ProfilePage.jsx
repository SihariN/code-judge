import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { DifficultyBadge } from "../components/Badges";
import ActivityChart from "../components/ActivityChart";

const DIFFICULTIES = [
  ["EASY", "Easy", "bg-emerald-500"],
  ["MEDIUM", "Medium", "bg-amber-500"],
  ["HARD", "Hard", "bg-red-500"],
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");

    api(`/users/${encodeURIComponent(username)}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (error) {
    return (
      <div>
        <p className="mb-4 text-red-300">{error}</p>
        <Link to="/leaderboard" className="text-indigo-400 hover:underline">
          Back to the leaderboard
        </Link>
      </div>
    );
  }

  if (!data) return <p className="text-slate-400">Loading...</p>;

  const { user, rank, stats, activity, recentSolved } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{user.username}</h1>
        <p className="text-sm text-slate-400">
          Joined {new Date(user.joinedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Rank" value={rank ? `#${rank}` : "-"} />
        <StatCard label="Solved" value={`${stats.solved}/${stats.totalProblems}`} />
        <StatCard label="Submissions" value={stats.submissions} />
        <StatCard
          label="Acceptance"
          value={stats.acceptance === null ? "-" : `${stats.acceptance}%`}
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Progress</h2>
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
          {DIFFICULTIES.map(([key, label, color]) => {
            const { solved, total } = stats.byDifficulty[key];
            const percent = total ? Math.round((solved / total) * 100) : 0;
            return (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{label}</span>
                  <span className="text-slate-400">
                    {solved}/{total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Activity (last 30 days)</h2>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <ActivityChart days={activity} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recently solved</h2>
        {recentSolved.length === 0 ? (
          <p className="text-slate-400">Nothing solved yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
            {recentSolved.map((p) => (
              <li key={p.slug} className="flex items-center justify-between px-4 py-3">
                <Link to={`/problems/${p.slug}`} className="font-medium hover:underline">
                  {p.title}
                </Link>
                <div className="flex items-center gap-3">
                  <DifficultyBadge difficulty={p.difficulty} />
                  <span className="text-sm text-slate-500">
                    {new Date(p.solvedAt).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
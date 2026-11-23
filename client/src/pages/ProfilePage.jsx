
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

function StatCard({ label, value, accent = "text-white" }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition-colors hover:border-slate-700">
      <div className={`text-2xl font-bold tracking-tight ${accent}`}>
        {value}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">
        {eyebrow}
      </p>
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
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
      <div className="mx-auto max-w-3xl rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="mb-2 font-semibold text-red-300">
          Unable to load profile
        </p>
        <p className="mb-5 text-sm text-slate-400">{error}</p>
        <Link
          to="/leaderboard"
          className="text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          ← Back to the leaderboard
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Loading profile...</p>
      </div>
    );
  }

  const { user, rank, stats, activity, recentSolved } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-9">
      {/* Profile header */}
      <header className="border-b border-slate-800 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          USER PROFILE
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {user.username}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Member since {new Date(user.joinedAt).toLocaleDateString()}
        </p>
      </header>

      {/* Statistics */}
      <section>
        <SectionHeading
          eyebrow="Overview"
          title="Performance statistics"
          description="A snapshot of this user's problem-solving progress."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Global rank"
            value={rank ? `#${rank}` : "—"}
            accent="text-indigo-300"
          />
          <StatCard
            label="Problems solved"
            value={`${stats.solved}/${stats.totalProblems}`}
            accent="text-emerald-300"
          />
          <StatCard
            label="Submissions"
            value={stats.submissions}
          />
          <StatCard
            label="Acceptance"
            value={
              stats.acceptance === null ? "—" : `${stats.acceptance}%`
            }
            accent="text-amber-300"
          />
        </div>
      </section>

      {/* Difficulty progress */}
      <section>
        <SectionHeading
          eyebrow="Problem solving"
          title="Difficulty progress"
          description="Problems solved in each difficulty category."
        />

        <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          {DIFFICULTIES.map(([key, label, color]) => {
            const { solved, total } = stats.byDifficulty[key];
            const percent = total
              ? Math.round((solved / total) * 100)
              : 0;

            return (
              <div key={key}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-200">
                    {label}
                  </span>

                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400">
                      {solved}/{total}
                    </span>
                    <span className="w-10 text-right font-medium tabular-nums text-slate-300">
                      {percent}%
                    </span>
                  </div>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-800"
                  role="progressbar"
                  aria-label={`${label} problems solved`}
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Activity chart */}
      <section>
        <SectionHeading
          eyebrow="Consistency"
          title="Recent activity"
          description="Submission activity over the last 30 days."
        />

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <ActivityChart days={activity} />
        </div>
      </section>

      {/* Recently solved */}
      <section>
        <SectionHeading
          eyebrow="Achievements"
          title="Recently solved"
          description="The latest problems successfully completed."
        />

        {recentSolved.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-10 text-center">
            <p className="font-medium text-slate-300">
              No solved problems yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Successfully solved problems will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
            {recentSolved.map((p) => (
              <li
                key={p.slug}
                className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  to={`/problems/${p.slug}`}
                  className="font-medium text-slate-200 transition-colors hover:text-indigo-300"
                >
                  {p.title}
                </Link>

                <div className="flex items-center gap-3">
                  <DifficultyBadge difficulty={p.difficulty} />
                  <span className="text-xs text-slate-500">
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

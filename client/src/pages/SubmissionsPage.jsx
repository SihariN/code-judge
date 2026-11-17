import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { VerdictBadge } from "../components/Badges";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api("/submissions?limit=50")
      .then((data) => {
        if (!cancelled) setSubmissions(data.submissions);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-red-300">{error}</p>;
  if (!submissions) return <p className="text-slate-400">Loading...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My submissions</h1>

      {submissions.length === 0 ? (
        <p className="text-slate-400">
          Nothing yet.{" "}
          <Link to="/" className="text-indigo-400 hover:underline">
            Pick a problem
          </Link>{" "}
          and submit your first solution.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Problem</th>
                <th className="px-4 py-2 font-medium">Verdict</th>
                <th className="px-4 py-2 font-medium">Tests</th>
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-2">
                    <Link
                      to={`/problems/${s.problem.slug}`}
                      className="text-indigo-400 hover:underline"
                    >
                      {s.problem.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <VerdictBadge verdict={s.verdict} />
                  </td>
                  <td className="px-4 py-2">
                    {s.passedTests}/{s.totalTests}
                  </td>
                  <td className="px-4 py-2">{s.timeMs} ms</td>
                  <td className="px-4 py-2 text-slate-400">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
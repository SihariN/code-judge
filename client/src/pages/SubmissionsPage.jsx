import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSubmissionUpdates } from "../hooks/useSubmissionUpdates";
import { upsert, mergeFresh } from "../lib/submissionState";
import { VerdictBadge } from "../components/Badges";

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState(null);
  const [error, setError] = useState("");

  // Refs hold values that callbacks need to read "right now" without
  // causing re-renders or re-subscriptions
  const knownIds = useRef(new Set());
  const isLoading = useRef(false);
  const loadAgain = useRef(false);

  useEffect(() => {
    knownIds.current = new Set((submissions || []).map((s) => s.id));
  }, [submissions]);

  const load = useCallback(async () => {
    // If a load is already running, ask it to run once more when it finishes,
    // so a result saved in between can't be missed
    if (isLoading.current) {
      loadAgain.current = true;
      return;
    }

    isLoading.current = true;
    try {
      do {
        loadAgain.current = false;
        const data = await api("/submissions?limit=50");
        setSubmissions((prev) => mergeFresh(prev || [], data.submissions));
        setError("");
      } while (loadAgain.current);
    } catch (err) {
      setError(err.message);
    } finally {
      isLoading.current = false;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = useCallback(
    (update) => {
      // A submission we haven't seen (made in another tab): reload the list,
      // because events don't carry the problem title
      if (!knownIds.current.has(update.id)) {
        load();
        return;
      }
      setSubmissions((prev) => upsert(prev, update));
    },
    [load]
  );

  useSubmissionUpdates({
    userId: user ? user.id : null,
    onUpdate: handleUpdate,
    onConnect: load,
  });

  if (error && !submissions) return <p className="text-red-300">{error}</p>;
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
                <th className="px-4 py-2 font-medium">#</th>
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
                      to={`/submissions/${s.id}`}
                      className="text-indigo-400 hover:underline"
                    >
                      #{s.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/problems/${s.problem.slug}`}
                      className="hover:underline"
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
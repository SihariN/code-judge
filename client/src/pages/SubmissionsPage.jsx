
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

  const knownIds = useRef(new Set());
  const isLoading = useRef(false);
  const loadAgain = useRef(false);

  useEffect(() => {
    knownIds.current = new Set((submissions || []).map((s) => s.id));
  }, [submissions]);

  const load = useCallback(async () => {
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

  if (error && !submissions) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="font-semibold text-red-300">
          Unable to load submissions
        </h2>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  if (!submissions) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page heading */}
      <header className="border-b border-slate-800 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          YOUR ACTIVITY
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              My submissions
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Review your previous attempts and their judging results.
            </p>
          </div>

          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
            {submissions.length} {submissions.length === 1 ? "submission" : "submissions"}
          </span>
        </div>
      </header>

      {/* Refresh error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          Unable to refresh submissions: {error}
        </div>
      )}

      {/* Empty state */}
      {submissions.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl text-slate-400">
            &gt;_
          </div>
          <h2 className="font-semibold text-slate-200">
            No submissions yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Your submitted solutions and their judging results will appear here.
            Start solving a problem to make your first submission.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Explore problems
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Submission history
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Your 50 most recent submissions
              </p>
            </div>
            <span className="text-xs text-slate-500">
              Live updates enabled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Problem</th>
                  <th className="px-4 py-3 font-medium">Verdict</th>
                  <th className="px-4 py-3 font-medium">Test cases</th>
                  <th className="px-4 py-3 font-medium">Runtime</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Link
                        to={`/submissions/${s.id}`}
                        className="font-medium text-indigo-400 transition hover:text-indigo-300"
                      >
                        #{s.id}
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link
                        to={`/problems/${s.problem.slug}`}
                        className="font-medium text-slate-200 transition hover:text-indigo-300"
                      >
                        {s.problem.title}
                      </Link>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <VerdictBadge verdict={s.verdict} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-300">
                      {s.passedTests}/{s.totalTests}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-400">
                      {s.timeMs} ms
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-800 px-4 py-3">
            <p className="text-xs text-slate-500">
              Select a submission ID to inspect its details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

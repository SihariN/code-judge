
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSubmissionUpdates } from "../hooks/useSubmissionUpdates";
import { isFinal } from "../lib/verdicts";
import { pickResult } from "../lib/submissionState";
import { getDraftKey } from "../lib/drafts";
import VerdictPanel from "../components/VerdictPanel";
import CodeEditor from "../components/CodeEditor";

export default function SubmissionDetailPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api(`/submissions/${idParam}`));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [idParam]);

  useEffect(() => {
    load();
  }, [load]);

  // Follow this submission while it is being judged.
  const handleUpdate = useCallback(
    (update) => {
      if (update.id !== id) return;

      setData((prev) => {
        if (!prev) return prev;

        if (isFinal(prev.submission.verdict) && !isFinal(update.verdict)) {
          return prev;
        }

        return {
          submission: { ...prev.submission, ...pickResult(update) },
          failure: update.failure ?? prev.failure,
        };
      });
    },
    [id]
  );

  useSubmissionUpdates({
    userId: user ? user.id : null,
    onUpdate: handleUpdate,
    onConnect: load,
  });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          to="/submissions"
          className="text-sm text-indigo-400 transition hover:text-indigo-300"
        >
          ← My submissions
        </Link>

        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="font-semibold text-red-300">
            Unable to load submission
          </h2>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button
            onClick={load}
            className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-slate-800" />
          <div className="h-8 w-64 rounded bg-slate-800" />
          <div className="h-4 w-48 rounded bg-slate-800" />
          <div className="h-48 rounded-xl bg-slate-900" />
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Loading submission details...
        </p>
      </div>
    );
  }

  const s = data.submission;

  function loadIntoEditor() {
    const ok = window.confirm(
      "Load this code into the editor? The draft currently saved for this problem will be replaced."
    );
    if (!ok) return;

    try {
      localStorage.setItem(getDraftKey(s.problem.slug), s.code);
    } catch {
      // Storage unavailable: still navigate to the problem.
    }

    navigate(`/problems/${s.problem.slug}`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/submissions"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition hover:text-indigo-300"
      >
        <span aria-hidden="true">←</span>
        My submissions
      </Link>

      <div className="mb-6 mt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Submission details
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Submission #{s.id}
            </h1>
          </div>

          <Link
            to={`/problems/${s.problem.slug}`}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-indigo-500/50 hover:text-white"
          >
            View problem
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-400">
          <Link
            to={`/problems/${s.problem.slug}`}
            className="font-medium text-indigo-400 transition hover:text-indigo-300"
          >
            {s.problem.title}
          </Link>
          <span className="text-slate-700">•</span>
          <span>{s.language}</span>
          <span className="text-slate-700">•</span>
          <time dateTime={s.createdAt}>
            {new Date(s.createdAt).toLocaleString()}
          </time>
        </div>
      </div>

      <section aria-label="Submission result">
        <VerdictPanel submission={{ ...s, failure: data.failure }} />
      </section>

      <section className="mt-7 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="font-semibold text-white">Submitted code</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Your original submission · Read only
            </p>
          </div>

          <button
            onClick={loadIntoEditor}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-500/50 hover:bg-slate-700"
          >
            Load into editor
          </button>
        </div>

        <CodeEditor value={s.code} readOnly height="380px" />
      </section>
    </div>
  );
}

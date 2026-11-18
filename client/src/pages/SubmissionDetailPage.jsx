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

  const [data, setData] = useState(null); // { submission, failure }
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

  // If this submission is still being judged, follow it live
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
      <div>
        <p className="mb-4 text-red-300">{error}</p>
        <Link to="/submissions" className="text-indigo-400 hover:underline">
          Back to my submissions
        </Link>
      </div>
    );
  }

  if (!data) return <p className="text-slate-400">Loading...</p>;

  const s = data.submission;

  function loadIntoEditor() {
    const ok = window.confirm(
      "Load this code into the editor? The draft currently saved for this problem will be replaced."
    );
    if (!ok) return;

    try {
      localStorage.setItem(getDraftKey(s.problem.slug), s.code);
    } catch {
      // storage unavailable: we still take the user to the problem
    }
    navigate(`/problems/${s.problem.slug}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/submissions" className="text-sm text-indigo-400 hover:underline">
        ← My submissions
      </Link>

      <h1 className="mb-1 mt-3 text-2xl font-bold">Submission #{s.id}</h1>
      <p className="mb-6 text-sm text-slate-400">
        <Link to={`/problems/${s.problem.slug}`} className="text-indigo-400 hover:underline">
          {s.problem.title}
        </Link>{" "}
        · {s.language} · {new Date(s.createdAt).toLocaleString()}
      </p>

      <VerdictPanel submission={{ ...s, failure: data.failure }} />

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-800">
        <div className="flex items-center justify-between bg-slate-900 px-3 py-2">
          <span className="text-sm text-slate-300">Your code</span>
          <button
            onClick={loadIntoEditor}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm text-slate-200 hover:bg-slate-700"
          >
            Load into editor
          </button>
        </div>
        <CodeEditor value={s.code} readOnly height="360px" />
      </div>
    </div>
  );
}
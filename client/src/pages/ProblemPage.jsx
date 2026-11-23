import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSubmissionUpdates } from "../hooks/useSubmissionUpdates";
import { isFinal } from "../lib/verdicts";
import { pickResult, upsert, mergeFresh } from "../lib/submissionState";
import { getDraftKey } from "../lib/drafts";
import { DifficultyBadge } from "../components/Badges";
import CodeEditor from "../components/CodeEditor";
import VerdictPanel from "../components/VerdictPanel";
import SubmissionHistory from "../components/SubmissionHistory";

const STARTER = "# Read input with input(), print the answer with print()\n\n";



// Wrapper: the "key" makes React build a fresh ProblemView for each problem,
// so code, history and results reset automatically when the URL changes
export default function ProblemPage() {
  const { slug } = useParams();
  return <ProblemView key={slug} slug={slug} />;
}

function ProblemView({ slug }) {
  const { user } = useAuth();
  const location = useLocation();

  const [problem, setProblem] = useState(null);
  const [loadError, setLoadError] = useState("");

  const draftKey = getDraftKey(slug);
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem(draftKey) ?? STARTER;
    } catch {
      return STARTER;
    }
  });

  const [submissions, setSubmissions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const active = submissions.find((s) => s.id === activeId) || null;
  const activeVerdict = active ? active.verdict : null;

  const applyUpdate = useCallback(
    (update) => setSubmissions((prev) => upsert(prev, update, slug)),
    [slug]
  );

  // 1. Load the problem
  useEffect(() => {
    let cancelled = false;

    api(`/problems/${slug}`)
      .then((data) => {
        if (!cancelled) setProblem(data.problem);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // 2. Save the draft as you type
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, code);
    } catch {
      // storage full or blocked: not worth interrupting the user
    }
  }, [draftKey, code]);

  // 3. Load submission history over REST (the source of truth)
  const loadHistory = useCallback(async () => {
    try {
      const data = await api(
        `/submissions?problem=${encodeURIComponent(slug)}&limit=10`
      );
      setSubmissions((prev) => mergeFresh(prev, data.submissions));
    } catch {
      // the page still works without history
    }
  }, [slug]);

  useEffect(() => {
    if (user) loadHistory();
  }, [user, loadHistory]);

  // 4. Live updates. On every (re)connection, re-fetch whatever we missed.
  useSubmissionUpdates({
    userId: user ? user.id : null,
    onUpdate: applyUpdate,
    onConnect: loadHistory,
  });

  // 5. Safety net: if the active submission is still in progress, ask REST for
  //    the final result every few seconds, in case socket events aren't arriving
  useEffect(() => {
    if (!activeId || !activeVerdict || isFinal(activeVerdict)) return;

    const timer = setInterval(async () => {
      try {
        const data = await api(`/submissions/${activeId}`);
        if (isFinal(data.submission.verdict)) {
          applyUpdate({
            ...pickResult(data.submission),
            problemSlug: slug,
            failure: data.failure,
          });
        }
      } catch {
        // try again on the next tick
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [activeId, activeVerdict, slug, applyUpdate]);

  async function handleSubmit() {
    if (!user || submitting) return;
    if (!code.trim()) {
      setSubmitError("Write some code first.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const data = await api(`/problems/${slug}/submit`, {
        method: "POST",
        body: { language: "python", code },
      });
      const created = { ...data.submission, problemSlug: slug };

      setActiveId(created.id);
      // Only add it if a live event hasn't already added it (events can win the race)
      setSubmissions((prev) =>
        prev.some((s) => s.id === created.id) ? prev : [created, ...prev]
      );
    } catch (err) {
      setSubmitError(
        err.status === 429
          ? "Too many submissions. Wait a minute and try again."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Clicking an old submission: show it, and fetch failure details if it has any
  async function selectSubmission(s) {
    setActiveId(s.id);
    if (isFinal(s.verdict) && s.failedTest && s.failure === undefined) {
      try {
        const data = await api(`/submissions/${s.id}`);
        applyUpdate({
          ...pickResult(data.submission),
          problemSlug: slug,
          failure: data.failure,
        });
      } catch {
        // keep showing what we have
      }
    }
  }

  if (loadError) {
    return (
      <div>
        <p className="mb-4 text-red-300">{loadError}</p>
        <Link to="/" className="text-indigo-400 hover:underline">
          Back to problems
        </Link>
      </div>
    );
  }

  if (!problem) return <p className="text-slate-400">Loading...</p>;


return (
  <div className="space-y-6">
    {/* Workspace header */}
    <div>
      <p className="mb-1 text-sm font-medium text-indigo-400">
        PROBLEM WORKSPACE
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-white">
        {problem.title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <DifficultyBadge difficulty={problem.difficulty} />
        <span className="text-xs text-slate-400">
          Time limit: {problem.timeLimitMs} ms
        </span>
        <span className="text-xs text-slate-400">
          Memory limit: {problem.memoryLimitMb} MB
        </span>
      </div>
    </div>

    {/* Main workspace */}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">

      {/* Left: problem statement */}
      <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="mb-5 border-b border-slate-800 pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Problem description
          </h2>
        </div>

        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{problem.description}</ReactMarkdown>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">
            Examples
          </h2>

          <div className="space-y-4">
            {problem.samples.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
              >
                <p className="mb-3 text-xs font-medium text-slate-400">
                  Example {i + 1}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Input
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-900 p-3 text-sm text-slate-200">
                      {s.input}
                    </pre>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Output
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-900 p-3 text-sm text-slate-200">
                      {s.expectedOutput}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Right: editor, results and history */}
      <section className="min-w-0 space-y-4">
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Code editor
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Python 3
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCode(STARTER)}
                className="rounded-md px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                Reset
              </button>

              {user ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit solution"}
                </button>
              ) : (
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Log in to submit
                </Link>
              )}
            </div>
          </div>

          <CodeEditor
            value={code}
            onChange={setCode}
            onSubmit={handleSubmit}
          />
        </div>

        {submitError && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </p>
        )}

        <VerdictPanel submission={active} />

        {active && (
          <Link
            to={`/submissions/${active.id}`}
            className="block text-sm text-indigo-400 transition hover:text-indigo-300 hover:underline"
          >
            View details and code for #{active.id}
          </Link>
        )}

        {user && (
          <SubmissionHistory
            submissions={submissions}
            activeId={activeId}
            onSelect={selectSubmission}
          />
        )}
      </section>
    </div>
  </div>
);

}
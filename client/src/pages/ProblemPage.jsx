import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { DifficultyBadge } from "../components/Badges";

export default function ProblemPage() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setProblem(null);
    setError("");

    api(`/problems/${slug}`)
      .then((data) => {
        if (!cancelled) setProblem(data.problem);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <div>
        <p className="mb-4 text-red-300">{error}</p>
        <Link to="/" className="text-indigo-400 hover:underline">
          Back to problems
        </Link>
      </div>
    );
  }

  if (!problem) return <p className="text-slate-400">Loading...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{problem.title}</h1>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      <p className="mb-6 text-sm text-slate-400">
        Time limit {problem.timeLimitMs} ms · Memory limit {problem.memoryLimitMb} MB
      </p>

      {/* Plain text for now; we'll render Markdown tomorrow */}
      <div className="mb-8 whitespace-pre-wrap leading-relaxed text-slate-200">
        {problem.description}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Examples</h2>
      <div className="space-y-4">
        {problem.samples.map((s, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs uppercase text-slate-400">Input</div>
              <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-sm">
                {s.input}
              </pre>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase text-slate-400">Output</div>
              <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-sm">
                {s.expectedOutput}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../lib/api";
import Field from "../components/Field";
import { DifficultyBadge } from "../components/Badges";

const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500";

const emptyCase = (isSample = false) => ({
  input: "",
  expectedOutput: "",
  isSample,
});

export default function AdminPage() {
  return (
    <div className="space-y-12">
      <CreateProblemForm />
      <ProblemTable />
    </div>
  );
}

function CreateProblemForm() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(128);
  const [description, setDescription] = useState("");
  const [cases, setCases] = useState([emptyCase(true), emptyCase()]);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function updateCase(index, patch) {
    setCases((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }

  function removeCase(index) {
    setCases((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      await api("/problems", {
        method: "POST",
        body: {
          slug,
          title,
          description,
          difficulty,
          timeLimitMs: Number(timeLimitMs),
          memoryLimitMb: Number(memoryLimitMb),
          testCases: cases.map((c) => ({
            // Programs usually read whole lines, so end the input with a newline
            input: c.input && !c.input.endsWith("\n") ? c.input + "\n" : c.input,
            expectedOutput: c.expectedOutput,
            isSample: c.isSample,
          })),
        },
      });
      navigate(`/problems/${slug.trim().toLowerCase()}`);
    } catch (err) {
      setErrors(
        err.details.length > 0
          ? err.details.map((d) => `${d.field}: ${d.message}`)
          : [err.message]
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Create a problem</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Field
            label="Slug (used in the URL)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="square-a-number"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={inputClass}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
          <Field
            label="Time limit (ms)"
            type="number"
            min="500"
            max="10000"
            value={timeLimitMs}
            onChange={(e) => setTimeLimitMs(e.target.value)}
          />
          <Field
            label="Memory limit (MB)"
            type="number"
            min="16"
            max="512"
            value={memoryLimitMb}
            onChange={(e) => setMemoryLimitMb(e.target.value)}
          />
        </div>

        <div>
          <span className="mb-1 block text-sm text-slate-300">
            Description (Markdown)
          </span>
          <div className="grid gap-4 lg:grid-cols-2">
            <textarea
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass + " font-mono text-sm"}
              placeholder={"Read an integer and print its square.\n\n**Input:** one integer.\n\n**Output:** its square."}
            />
            <div className="prose prose-invert max-w-none rounded-md border border-slate-800 p-3">
              {description.trim() ? (
                <ReactMarkdown>{description}</ReactMarkdown>
              ) : (
                <p className="text-slate-500">The preview appears here.</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-1 text-lg font-semibold">Test cases</h2>
          <p className="mb-3 text-sm text-slate-400">
            Tick &quot;Show as example&quot; for cases users may see. Unticked cases are
            hidden and only used for judging. At least one example is required.
          </p>

          <div className="space-y-3">
            {cases.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-800 bg-slate-900 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">
                    Case {i + 1}
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={c.isSample}
                        onChange={(e) =>
                          updateCase(i, { isSample: e.target.checked })
                        }
                      />
                      Show as example
                    </label>
                    <button
                      type="button"
                      onClick={() => removeCase(i)}
                      disabled={cases.length === 1}
                      className="text-sm text-red-300 hover:underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <textarea
                    rows={3}
                    placeholder="Input"
                    value={c.input}
                    onChange={(e) => updateCase(i, { input: e.target.value })}
                    className={inputClass + " font-mono text-sm"}
                  />
                  <textarea
                    rows={3}
                    placeholder="Expected output"
                    value={c.expectedOutput}
                    onChange={(e) =>
                      updateCase(i, { expectedOutput: e.target.value })
                    }
                    className={inputClass + " font-mono text-sm"}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCases((prev) => [...prev, emptyCase()])}
            className="mt-3 rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
          >
            + Add test case
          </button>
        </div>

        {errors.length > 0 && (
          <ul className="space-y-1 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errors.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create problem"}
        </button>
      </form>
    </section>
  );
}

function ProblemTable() {
  const [problems, setProblems] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api("/problems");
      setProblems(data.problems);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(problem) {
    const ok = window.confirm(
      `Delete "${problem.title}"? This also deletes its test cases and every submission made to it.`
    );
    if (!ok) return;

    try {
      await api(`/problems/${problem.slug}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Existing problems</h2>

      {error && (
        <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {!problems && !error && <p className="text-slate-400">Loading...</p>}

      {problems && (
        <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
          {problems.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Link to={`/problems/${p.slug}`} className="font-medium hover:underline">
                  {p.title}
                </Link>
                <DifficultyBadge difficulty={p.difficulty} />
                <span className="text-sm text-slate-500">{p.slug}</span>
              </div>
              <button
                onClick={() => remove(p)}
                className="text-sm text-red-300 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../lib/api";
import Field from "../components/Field";
import { DifficultyBadge } from "../components/Badges";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const emptyCase = (isSample = false) => ({
  input: "",
  expectedOutput: "",
  isSample,
});

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">
        {eyebrow}
      </p>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header className="border-b border-slate-800 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          ADMINISTRATION
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Problem management
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Create programming challenges, configure test cases and manage the
          problems available on Code Judge.
        </p>
      </header>

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
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 sm:p-7">
      <SectionHeader
        eyebrow="New challenge"
        title="Create a problem"
        description="Define the problem statement, execution limits and test cases."
      />

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Basic information */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-200">
            Basic information
          </h3>

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
        </div>

        {/* Execution settings */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-200">
            Execution settings
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">
                Difficulty
              </span>
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
        </div>

        {/* Problem description */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Problem description
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Write the statement using Markdown. The preview updates as you type.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Markdown editor
              </label>
              <textarea
                rows={12}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass + " min-h-64 resize-y font-mono leading-6"}
                placeholder={"Read an integer and print its square.\n\n**Input:** one integer.\n\n**Output:** its square."}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Live preview
              </label>
              <div className="prose prose-invert min-h-64 max-w-none rounded-lg border border-slate-800 bg-slate-950 p-4 prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-code:text-indigo-300">
                {description.trim() ? (
                  <ReactMarkdown>{description}</ReactMarkdown>
                ) : (
                  <p className="text-sm text-slate-600">
                    Your problem statement preview will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test cases */}
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Test cases
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Example cases are visible to users. Hidden cases are used only by
              the judge to evaluate submissions. At least one example is required.
            </p>
          </div>

          <div className="space-y-3">
            {cases.map((c, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 ${
                  c.isSample
                    ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                    : "border-slate-800 bg-slate-950/70"
                }`}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">
                      Test case {i + 1}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        c.isSample
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {c.isSample ? "Public example" : "Hidden"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCase(i)}
                    disabled={cases.length === 1}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                      Input
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter test input..."
                      value={c.input}
                      onChange={(e) => updateCase(i, { input: e.target.value })}
                      className={inputClass + " resize-y font-mono"}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                      Expected output
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter expected output..."
                      value={c.expectedOutput}
                      onChange={(e) =>
                        updateCase(i, { expectedOutput: e.target.value })
                      }
                      className={inputClass + " resize-y font-mono"}
                    />
                  </div>
                </div>

                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={c.isSample}
                    onChange={(e) =>
                      updateCase(i, { isSample: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-600 accent-indigo-500"
                  />
                  Show this case as a public example
                </label>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCases((prev) => [...prev, emptyCase()])}
            className="mt-4 rounded-lg border border-dashed border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-300"
          >
            + Add test case
          </button>
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {errors.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        )}

        {/* Submit */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
          <p className="text-xs text-slate-500">
            Review the statement and test cases before creating.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating problem..." : "Create problem"}
          </button>
        </div>
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
      <SectionHeader
        eyebrow="Content management"
        title="Existing problems"
        description="View the available challenges or remove a problem."
      />

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!problems && !error && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">Loading problems...</p>
        </div>
      )}

      {problems && problems.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-10 text-center">
          <p className="font-medium text-slate-300">No problems available</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first problem using the form above.
          </p>
        </div>
      )}

      {problems && problems.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <span className="text-sm font-medium text-slate-300">
              Problem library
            </span>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
              {problems.length} total
            </span>
          </div>

          <ul className="divide-y divide-slate-800">
            {problems.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    to={`/problems/${p.slug}`}
                    className="font-medium text-slate-200 transition-colors hover:text-indigo-300"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {p.slug}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <DifficultyBadge difficulty={p.difficulty} />

                  <button
                    onClick={() => remove(p)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

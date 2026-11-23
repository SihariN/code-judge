
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-indigo-500/20 bg-indigo-500/10">
          <span className="text-4xl font-extrabold tracking-tight text-indigo-400">
            404
          </span>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
          Page not found
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Looks like you're lost.
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-400">
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back to solving problems.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Back to problems
        </Link>
      </div>
    </div>
  );
}

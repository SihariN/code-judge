import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-2 text-4xl font-bold">404</h1>
      <p className="mb-6 text-slate-400">That page doesn't exist.</p>
      <Link to="/" className="text-indigo-400 hover:underline">
        Back to problems
      </Link>
    </div>
  );
}
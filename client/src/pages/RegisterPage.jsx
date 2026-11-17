import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Field from "../components/Field";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(email, username, password);
      navigate("/", { replace: true });
    } catch (err) {
      // Zod validation errors arrive as [{ field, message }]
      const byField = {};
      for (const d of err.details) byField[d.field] = d.message;
      setFieldErrors(byField);
      // Only show the general message when there are no per-field messages
      if (err.details.length === 0) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Create an account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
          autoComplete="email"
        />
        <Field
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={fieldErrors.username}
          required
          autoComplete="username"
        />
        <Field
          label="Password (at least 8 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
          autoComplete="new-password"
        />

        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="text-indigo-400 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
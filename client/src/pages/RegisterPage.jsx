
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Field from "../components/Field";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteRequired, setInviteRequired] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Ask the server whether this site is invite-only.
  useEffect(() => {
    let cancelled = false;

    api("/auth/config")
      .then((data) => {
        if (!cancelled) setInviteRequired(data.inviteRequired);
      })
      .catch(() => {
        // The server still enforces the registration rule.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);

    try {
      await register(
        email,
        username,
        password,
        inviteRequired ? inviteCode : undefined
      );
      navigate("/", { replace: true });
    } catch (err) {
      // Zod validation errors arrive as [{ field, message }].
      const byField = {};

      for (const d of err.details) {
        byField[d.field] = d.message;
      }

      setFieldErrors(byField);

      if (err.details.length === 0) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-md items-center justify-center py-10">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/10 sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-2xl font-bold text-indigo-400">
            CJ
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Join Code Judge and start solving problems.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {inviteRequired && (
            <Field
              label="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              autoComplete="off"
            />
          )}

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

          <div>
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              required
              autoComplete="new-password"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Must contain at least 8 characters.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="my-6 border-t border-slate-800" />

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-400 transition hover:text-indigo-300"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}


import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  "rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
  (isActive
    ? "bg-slate-800 text-white"
    : "text-slate-400 hover:bg-slate-800/60 hover:text-white");

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className="mr-2 text-xl font-extrabold tracking-tight text-white"
          >
            Code<span className="text-indigo-400">Judge</span>
          </Link>

          <NavLink to="/" end className={linkClass}>
            Problems
          </NavLink>

          <NavLink to="/leaderboard" className={linkClass}>
            Leaderboard
          </NavLink>

          {user && (
            <NavLink to="/submissions" className={linkClass}>
              My submissions
            </NavLink>
          )}

          {user?.role === "ADMIN" && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                to={`/users/${user.username}`}
                className="max-w-32 truncate rounded-lg px-2 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white sm:max-w-none sm:px-3"
                title={user.username}
              >
                {user.username}
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>

              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

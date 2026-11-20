import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  "rounded-md px-3 py-1.5 text-sm font-medium " +
  (isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white");

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-bold text-white">
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

          {user && user.role === "ADMIN" && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
          
        </div>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link
                to={`/users/${user.username}`}
                className="text-slate-300 hover:text-white"
              >
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700"
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
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
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
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="text-slate-400">Loading...</p>;

  if (!user) {
    // Remember where they were going, so login can send them back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="text-slate-400">Loading...</p>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-4xl font-bold">403</h1>
        <p className="text-slate-400">This page is for admins only.</p>
      </div>
    );
  }

  return children;
}
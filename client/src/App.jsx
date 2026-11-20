import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemPage from "./pages/ProblemPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import SubmissionDetailPage from "./pages/SubmissionDetailPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<ProblemsPage />} />
          <Route path="/problems/:slug" element={<ProblemPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/users/:username" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/submissions"
            element={
              <ProtectedRoute>
                <SubmissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions/:id"
            element={
              <ProtectedRoute>
                <SubmissionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

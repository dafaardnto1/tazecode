import { Navigate } from "react-router-dom";
import { useAdminAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, checking } = useAdminAuth();

  if (checking) return <div className="admin-loading">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

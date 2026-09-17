import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../AuthContext";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      navigate("/admin");
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Tidak bisa terhubung ke API. Pastikan Worker sudah berjalan/di-deploy." : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      <Helmet>
        <title>Admin Login — TAZECODE</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="admin-login-card">
        <div className="brand"><span className="dot" />TAZECODE</div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)", marginBottom: 20, textAlign: "center" }}>
          Dashboard Admin — masuk untuk kelola konten
        </p>
        {error && <div className="admin-alert">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          <div className="admin-field">
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </div>
          <div className="admin-field">
            <label htmlFor="password">Password</label>
            <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center", marginTop: 4 }}>
            {loading ? "Masuk…" : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

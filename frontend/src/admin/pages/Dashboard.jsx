import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getProjects(), api.getServices(), api.getMessages(), api.getAllTestimonials()])
      .then(([projects, services, messages, testimonials]) => {
        setStats({
          projects: projects.length,
          services: services.length,
          messages: messages.length,
          unread: messages.filter((m) => !m.is_read).length,
          testimonials: testimonials.length
        });
      })
      .catch(() => setError("Tidak bisa memuat data dari API. Pastikan Worker sudah di-deploy dan VITE_API_URL sudah diset."));
  }, []);

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Dashboard</div>
          <div className="admin-subtitle">Ringkasan konten website TAZECODE.</div>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.projects}</div>
            <div className="admin-stat-label">Total Projects</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.services}</div>
            <div className="admin-stat-label">Total Services</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.testimonials}</div>
            <div className="admin-stat-label">Total Testimonials</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.unread}</div>
            <div className="admin-stat-label">Unread Messages</div>
          </div>
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Quick Actions</h2></div>
        <div style={{ padding: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/admin/projects" className="admin-btn primary">+ Kelola Projects</Link>
          <Link to="/admin/services" className="admin-btn">Kelola Services</Link>
          <Link to="/admin/testimonials" className="admin-btn">Kelola Testimonials</Link>
          <Link to="/admin/messages" className="admin-btn">Lihat Messages</Link>
        </div>
      </div>
    </>
  );
}

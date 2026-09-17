import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import ProjectForm from "../components/ProjectForm";
import ProjectGalleryManager from "../components/ProjectGalleryManager";

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [galleryProject, setGalleryProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api.getProjects()
      .then(setProjects)
      .catch(() => setError("Tidak bisa memuat data. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing?.id) {
        await api.updateProject(editing.id, payload);
      } else {
        await api.createProject(payload);
      }
      setEditing(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(project) {
    if (!confirm(`Hapus project "${project.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    await api.deleteProject(project.id);
    load();
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Projects</div>
          <div className="admin-subtitle">Kelola portofolio yang tampil di halaman Projects & Home.</div>
        </div>
        {!editing && (
          <button className="admin-btn primary" onClick={() => setEditing({})}>+ Tambah Project</button>
        )}
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {editing && (
        <div className="admin-panel">
          <div className="admin-panel-head"><h2>{editing.id ? "Edit Project" : "Project Baru"}</h2></div>
          <ProjectForm
            initial={editing.id ? editing : null}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {galleryProject && (
        <ProjectGalleryManager project={galleryProject} onClose={() => setGalleryProject(null)} />
      )}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Semua Project ({projects.length})</h2></div>
        {loading ? (
          <div className="admin-loading">Memuat…</div>
        ) : projects.length === 0 ? (
          <div className="admin-empty">Belum ada project.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Tahun</th>
                  <th>Featured</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong><div style={{ color: "var(--muted)", fontSize: 12.5 }}>/{p.slug}</div></td>
                    <td>{p.category}</td>
                    <td>{p.year}</td>
                    <td>{p.featured ? "✓" : "—"}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="admin-btn" onClick={() => setGalleryProject(p)}>Galeri</button>
                        <button className="admin-btn" onClick={() => setEditing(p)}>Edit</button>
                        <button className="admin-btn danger" onClick={() => handleDelete(p)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import ArticleForm from "../components/ArticleForm";

export default function AdminArticles() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api.getAllArticles()
      .then(setItems)
      .catch(() => setError("Tidak bisa memuat data. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing?.id) {
        await api.updateArticle(editing.id, payload);
      } else {
        await api.createArticle(payload);
      }
      setEditing(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Hapus artikel "${item.title}"?`)) return;
    await api.deleteArticle(item.id);
    load();
  }

  async function togglePublish(item) {
    await api.updateArticle(item.id, { is_published: !item.is_published });
    load();
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Blog / Artikel</div>
          <div className="admin-subtitle">Kelola artikel blog untuk SEO — tampil di halaman /blog.</div>
        </div>
        {!editing && (
          <button className="admin-btn primary" onClick={() => setEditing({})}>+ Tulis Artikel</button>
        )}
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {editing && (
        <div className="admin-panel">
          <div className="admin-panel-head"><h2>{editing.id ? "Edit Artikel" : "Artikel Baru"}</h2></div>
          <ArticleForm
            initial={editing.id ? editing : null}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Semua Artikel ({items.length})</h2></div>
        {loading ? (
          <div className="admin-loading">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="admin-empty">Belum ada artikel. Tulis artikel pertama untuk mulai bangun traffic SEO.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.title}</strong></td>
                    <td style={{ color: "var(--muted)", fontSize: 12.5 }}>/blog/{a.slug}</td>
                    <td>
                      <button className="admin-btn" onClick={() => togglePublish(a)}>
                        {a.is_published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="admin-btn" onClick={() => setEditing(a)}>Edit</button>
                        <button className="admin-btn danger" onClick={() => handleDelete(a)}>Hapus</button>
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

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import TestimonialForm from "../components/TestimonialForm";

export default function AdminTestimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api.getAllTestimonials()
      .then(setItems)
      .catch(() => setError("Tidak bisa memuat data. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing?.id) {
        await api.updateTestimonial(editing.id, payload);
      } else {
        await api.createTestimonial(payload);
      }
      setEditing(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Hapus review dari "${item.client_name}"?`)) return;
    await api.deleteTestimonial(item.id);
    load();
  }

  async function togglePublish(item) {
    await api.updateTestimonial(item.id, { is_published: !item.is_published });
    load();
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Testimonials</div>
          <div className="admin-subtitle">Kelola review/testimoni klien yang tampil di halaman Home. Jangan buat review palsu — hanya masukkan feedback klien yang nyata.</div>
        </div>
        {!editing && (
          <button className="admin-btn primary" onClick={() => setEditing({})}>+ Tambah Review</button>
        )}
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {editing && (
        <div className="admin-panel">
          <div className="admin-panel-head"><h2>{editing.id ? "Edit Review" : "Review Baru"}</h2></div>
          <TestimonialForm
            initial={editing.id ? editing : null}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Semua Review ({items.length})</h2></div>
        {loading ? (
          <div className="admin-loading">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="admin-empty">Belum ada review. Tambahkan testimoni klien nyata di sini — akan otomatis tampil di halaman Home.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Klien</th>
                  <th>Review</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.client_name}</strong>
                      <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{[t.client_position, t.client_company].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td style={{ maxWidth: 320, color: "var(--muted)" }}>{t.review_text}</td>
                    <td>{"★".repeat(t.rating || 5)}</td>
                    <td>
                      <button className="admin-btn" onClick={() => togglePublish(t)}>
                        {t.is_published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="admin-btn" onClick={() => setEditing(t)}>Edit</button>
                        <button className="admin-btn danger" onClick={() => handleDelete(t)}>Hapus</button>
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

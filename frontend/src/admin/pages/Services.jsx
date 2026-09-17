import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import ServiceForm from "../components/ServiceForm";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api.getServices()
      .then(setServices)
      .catch(() => setError("Tidak bisa memuat data. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing?.id) {
        await api.updateService(editing.id, payload);
      } else {
        await api.createService(payload);
      }
      setEditing(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(service) {
    if (!confirm(`Hapus layanan "${service.title}"?`)) return;
    await api.deleteService(service.id);
    load();
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Services</div>
          <div className="admin-subtitle">Kelola daftar layanan di halaman Services.</div>
        </div>
        {!editing && (
          <button className="admin-btn primary" onClick={() => setEditing({})}>+ Tambah Layanan</button>
        )}
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {editing && (
        <div className="admin-panel">
          <div className="admin-panel-head"><h2>{editing.id ? "Edit Layanan" : "Layanan Baru"}</h2></div>
          <ServiceForm
            initial={editing.id ? editing : null}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Semua Layanan ({services.length})</h2></div>
        {loading ? (
          <div className="admin-loading">Memuat…</div>
        ) : services.length === 0 ? (
          <div className="admin-empty">Belum ada layanan.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Deskripsi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.title}</strong></td>
                    <td style={{ color: "var(--muted)", maxWidth: 420 }}>{s.description}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="admin-btn" onClick={() => setEditing(s)}>Edit</button>
                        <button className="admin-btn danger" onClick={() => handleDelete(s)}>Hapus</button>
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

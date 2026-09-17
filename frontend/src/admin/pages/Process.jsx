import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import ProcessStepForm from "../components/ProcessStepForm";

export default function AdminProcess() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api.getProcessSteps()
      .then(setSteps)
      .catch(() => setError("Tidak bisa memuat data. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing?.id) {
        await api.updateProcessStep(editing.id, payload);
      } else {
        await api.createProcessStep(payload);
      }
      setEditing(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(step) {
    if (!confirm(`Hapus langkah "${step.title}"?`)) return;
    await api.deleteProcessStep(step.id);
    load();
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Cara Kerja</div>
          <div className="admin-subtitle">Kelola langkah-langkah proses kerja yang tampil di Beranda (timeline animasi).</div>
        </div>
        {!editing && (
          <button className="admin-btn primary" onClick={() => setEditing({})}>+ Tambah Langkah</button>
        )}
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {editing && (
        <div className="admin-panel">
          <div className="admin-panel-head"><h2>{editing.id ? "Edit Langkah" : "Langkah Baru"}</h2></div>
          <ProcessStepForm
            initial={editing.id ? editing : null}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Semua Langkah ({steps.length})</h2></div>
        {loading ? (
          <div className="admin-loading">Memuat…</div>
        ) : steps.length === 0 ? (
          <div className="admin-empty">Belum ada langkah proses.</div>
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
                {steps.map((s) => (
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

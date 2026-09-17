import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import FaqForm from "../components/FaqForm";

export default function AdminFaq() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api.getFaqs()
      .then(setFaqs)
      .catch(() => setError("Tidak bisa memuat data. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing?.id) {
        await api.updateFaq(editing.id, payload);
      } else {
        await api.createFaq(payload);
      }
      setEditing(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(faq) {
    if (!confirm(`Hapus FAQ "${faq.question}"?`)) return;
    await api.deleteFaq(faq.id);
    load();
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">FAQ</div>
          <div className="admin-subtitle">Kelola pertanyaan yang sering ditanyakan, tampil di halaman Harga.</div>
        </div>
        {!editing && (
          <button className="admin-btn primary" onClick={() => setEditing({})}>+ Tambah FAQ</button>
        )}
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {editing && (
        <div className="admin-panel">
          <div className="admin-panel-head"><h2>{editing.id ? "Edit FAQ" : "FAQ Baru"}</h2></div>
          <FaqForm
            initial={editing.id ? editing : null}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Semua FAQ ({faqs.length})</h2></div>
        {loading ? (
          <div className="admin-loading">Memuat…</div>
        ) : faqs.length === 0 ? (
          <div className="admin-empty">Belum ada FAQ.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pertanyaan</th>
                  <th>Jawaban</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.question}</strong></td>
                    <td style={{ color: "var(--muted)", maxWidth: 420 }}>{f.answer}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="admin-btn" onClick={() => setEditing(f)}>Edit</button>
                        <button className="admin-btn danger" onClick={() => handleDelete(f)}>Hapus</button>
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

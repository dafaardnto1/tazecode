import { useEffect, useState } from "react";
import { api } from "../../lib/api";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function AdminSubscribers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function load() {
    setLoading(true);
    api.getSubscribers()
      .then(setItems)
      .catch(() => setError("Tidak bisa memuat data. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(item) {
    if (!confirm(`Hapus subscriber "${item.email}"?`)) return;
    await api.deleteSubscriber(item.id);
    load();
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(items.map((i) => i.email).join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Newsletter Subscribers</div>
          <div className="admin-subtitle">Email pengunjung yang berlangganan lewat halaman Blog.</div>
        </div>
        {items.length > 0 && (
          <button className="admin-btn primary" onClick={copyAll}>{copied ? "Tersalin!" : "Salin Semua Email"}</button>
        )}
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Semua Subscriber ({items.length})</h2></div>
        {loading ? (
          <div className="admin-loading">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="admin-empty">Belum ada subscriber.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Tanggal Daftar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.email}</strong></td>
                    <td style={{ color: "var(--muted)" }}>{formatDate(s.created_at)}</td>
                    <td>
                      <div className="admin-row-actions">
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

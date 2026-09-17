import { Fragment, useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  function load() {
    setLoading(true);
    api.getMessages()
      .then(setMessages)
      .catch(() => setError("Tidak bisa memuat data. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleOpen(msg) {
    const willOpen = openId !== msg.id;
    setOpenId(willOpen ? msg.id : null);
    if (willOpen && !msg.is_read) {
      await api.markMessageRead(msg.id, true);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
    }
  }

  async function handleDelete(msg) {
    if (!confirm(`Hapus pesan dari "${msg.name}"?`)) return;
    await api.deleteMessage(msg.id);
    load();
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Messages</div>
          <div className="admin-subtitle">Pesan masuk dari form kontak.</div>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Inbox ({messages.length})</h2></div>
        {loading ? (
          <div className="admin-loading">Memuat…</div>
        ) : messages.length === 0 ? (
          <div className="admin-empty">Belum ada pesan masuk.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Dari</th>
                  <th>Subjek</th>
                  <th>Tanggal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <Fragment key={m.id}>
                    <tr className={!m.is_read ? "unread" : ""}>
                      <td>
                        <strong>{m.name}</strong>
                        <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{m.email}</div>
                      </td>
                      <td>{m.subject || <span style={{ color: "var(--muted)" }}>(tanpa subjek)</span>}</td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--muted)", fontSize: 12.5 }}>{m.created_at}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button className="admin-btn" onClick={() => toggleOpen(m)}>{openId === m.id ? "Tutup" : "Baca"}</button>
                          <button className="admin-btn danger" onClick={() => handleDelete(m)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                    {openId === m.id && (
                      <tr>
                        <td colSpan={4} style={{ background: "var(--paper-2)", whiteSpace: "pre-wrap" }}>{m.message}</td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

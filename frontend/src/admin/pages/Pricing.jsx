import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import PricingForm from "../components/PricingForm";

function formatPrice(price) {
  const num = Number(price);
  if (!num || Number.isNaN(num)) return price;
  return "Rp " + num.toLocaleString("id-ID");
}

export default function AdminPricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    api.getPricing()
      .then(setPlans)
      .catch(() => setError("Tidak bisa memuat data. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing?.id) {
        await api.updatePricing(editing.id, payload);
      } else {
        await api.createPricing(payload);
      }
      setEditing(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(plan) {
    if (!confirm(`Hapus paket "${plan.name}"?`)) return;
    await api.deletePricing(plan.id);
    load();
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Harga / Pricelist</div>
          <div className="admin-subtitle">Kelola paket harga yang tampil di halaman Harga.</div>
        </div>
        {!editing && (
          <button className="admin-btn primary" onClick={() => setEditing({})}>+ Tambah Paket</button>
        )}
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {editing && (
        <div className="admin-panel">
          <div className="admin-panel-head"><h2>{editing.id ? "Edit Paket" : "Paket Baru"}</h2></div>
          <PricingForm
            initial={editing.id ? editing : null}
            submitting={submitting}
            onCancel={() => setEditing(null)}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Semua Paket ({plans.length})</h2></div>
        {loading ? (
          <div className="admin-loading">Memuat…</div>
        ) : plans.length === 0 ? (
          <div className="admin-empty">Belum ada paket harga.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Harga</th>
                  <th>Populer</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{formatPrice(p.price)}</td>
                    <td>{p.is_popular ? "✓" : "—"}</td>
                    <td>
                      <div className="admin-row-actions">
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

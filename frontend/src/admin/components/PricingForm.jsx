import { useState } from "react";

function toFormState(plan) {
  return {
    name: plan?.name || "",
    price: plan?.price || "",
    price_suffix: plan?.price_suffix || "",
    description: plan?.description || "",
    featuresText: (plan?.features || []).join("\n"),
    is_popular: !!plan?.is_popular
  };
}

export default function PricingForm({ initial, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(() => toFormState(initial));
  const [error, setError] = useState("");

  function set(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!values.name.trim()) {
      setError("Nama paket wajib diisi.");
      return;
    }
    if (!values.price.trim()) {
      setError("Harga wajib diisi.");
      return;
    }
    const payload = {
      name: values.name.trim(),
      price: values.price.trim(),
      price_suffix: values.price_suffix,
      description: values.description,
      features: values.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
      is_popular: values.is_popular
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || "Gagal menyimpan.");
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="admin-alert">{error}</div>}
      <div className="admin-field">
        <label htmlFor="name">Nama Paket *</label>
        <input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Company Profile" />
      </div>
      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="price">Harga (angka, atau teks seperti "Hubungi Kami") *</label>
          <input id="price" value={values.price} onChange={(e) => set("price", e.target.value)} placeholder="1500000" />
        </div>
        <div className="admin-field">
          <label htmlFor="price_suffix">Label Harga (opsional)</label>
          <input id="price_suffix" value={values.price_suffix} onChange={(e) => set("price_suffix", e.target.value)} placeholder="mulai dari" />
        </div>
      </div>
      <div className="admin-field">
        <label htmlFor="description">Deskripsi</label>
        <textarea id="description" rows={2} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="admin-field">
        <label htmlFor="featuresText">Fitur (satu per baris)</label>
        <textarea id="featuresText" rows={4} value={values.featuresText} onChange={(e) => set("featuresText", e.target.value)} />
      </div>
      <label className="admin-checkbox">
        <input type="checkbox" checked={values.is_popular} onChange={(e) => set("is_popular", e.target.checked)} />
        Tandai sebagai paket populer
      </label>
      <div className="admin-form-actions">
        <button type="button" className="admin-btn" onClick={onCancel}>Batal</button>
        <button type="submit" className="admin-btn primary" disabled={submitting}>
          {submitting ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}

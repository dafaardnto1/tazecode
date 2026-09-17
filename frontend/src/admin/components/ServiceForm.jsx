import { useState } from "react";

function toFormState(service) {
  return {
    title: service?.title || "",
    description: service?.description || "",
    featuresText: (service?.features || []).join("\n")
  };
}

export default function ServiceForm({ initial, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(() => toFormState(initial));
  const [error, setError] = useState("");

  function set(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!values.title.trim()) {
      setError("Judul layanan wajib diisi.");
      return;
    }
    const payload = {
      title: values.title.trim(),
      description: values.description,
      features: values.featuresText.split("\n").map((s) => s.trim()).filter(Boolean)
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
        <label htmlFor="title">Judul Layanan *</label>
        <input id="title" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="Jasa Company Profile" />
      </div>
      <div className="admin-field">
        <label htmlFor="description">Deskripsi</label>
        <textarea id="description" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="admin-field">
        <label htmlFor="featuresText">Fitur (satu per baris)</label>
        <textarea id="featuresText" rows={4} value={values.featuresText} onChange={(e) => set("featuresText", e.target.value)} />
      </div>
      <div className="admin-form-actions">
        <button type="button" className="admin-btn" onClick={onCancel}>Batal</button>
        <button type="submit" className="admin-btn primary" disabled={submitting}>
          {submitting ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}

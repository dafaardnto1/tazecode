import { useState } from "react";

function toFormState(step) {
  return {
    title: step?.title || "",
    description: step?.description || ""
  };
}

export default function ProcessStepForm({ initial, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(() => toFormState(initial));
  const [error, setError] = useState("");

  function set(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!values.title.trim()) {
      setError("Judul langkah wajib diisi.");
      return;
    }
    try {
      await onSubmit({ title: values.title.trim(), description: values.description });
    } catch (err) {
      setError(err.message || "Gagal menyimpan.");
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="admin-alert">{error}</div>}
      <div className="admin-field">
        <label htmlFor="title">Judul Langkah *</label>
        <input id="title" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="Diskusi Kebutuhan" />
      </div>
      <div className="admin-field">
        <label htmlFor="description">Deskripsi</label>
        <textarea id="description" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />
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

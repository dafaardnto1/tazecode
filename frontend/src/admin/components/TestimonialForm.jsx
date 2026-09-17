import { useState } from "react";
import ImageUpload from "./ImageUpload";

function toFormState(t) {
  return {
    client_name: t?.client_name || "",
    client_position: t?.client_position || "",
    client_company: t?.client_company || "",
    photo_url: t?.photo_url || "",
    review_text: t?.review_text || "",
    project_slug: t?.project_slug || "",
    rating: t?.rating ?? 5,
    is_published: t?.is_published ?? true
  };
}

export default function TestimonialForm({ initial, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(() => toFormState(initial));
  const [error, setError] = useState("");

  function set(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!values.client_name.trim() || !values.review_text.trim()) {
      setError("Nama klien dan isi review wajib diisi.");
      return;
    }
    try {
      await onSubmit({ ...values, rating: Number(values.rating) });
    } catch (err) {
      setError(err.message || "Gagal menyimpan.");
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="client_name">Nama Klien *</label>
          <input id="client_name" value={values.client_name} onChange={(e) => set("client_name", e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="client_position">Jabatan</label>
          <input id="client_position" value={values.client_position} onChange={(e) => set("client_position", e.target.value)} placeholder="Owner, Marketing, dll" />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="client_company">Perusahaan / Bisnis</label>
        <input id="client_company" value={values.client_company} onChange={(e) => set("client_company", e.target.value)} />
      </div>

      <ImageUpload label="Foto Klien (opsional)" value={values.photo_url} onChange={(url) => set("photo_url", url)} />

      <div className="admin-field">
        <label htmlFor="review_text">Isi Review *</label>
        <textarea id="review_text" rows={4} value={values.review_text} onChange={(e) => set("review_text", e.target.value)} />
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="project_slug">Terkait Project (slug)</label>
          <input id="project_slug" value={values.project_slug} onChange={(e) => set("project_slug", e.target.value)} placeholder="opsional, mis. kasir-warung-pos" />
        </div>
        <div className="admin-field">
          <label htmlFor="rating">Rating (1–5)</label>
          <select id="rating" value={values.rating} onChange={(e) => set("rating", e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <label className="admin-checkbox">
        <input type="checkbox" checked={!!values.is_published} onChange={(e) => set("is_published", e.target.checked)} />
        Tampilkan di halaman publik
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

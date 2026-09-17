import { useState } from "react";
import ImageUpload from "./ImageUpload";

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toFormState(a) {
  return {
    title: a?.title || "",
    slug: a?.slug || "",
    excerpt: a?.excerpt || "",
    content: a?.content || "",
    cover_image_url: a?.cover_image_url || "",
    is_published: a?.is_published ?? true
  };
}

export default function ArticleForm({ initial, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(() => toFormState(initial));
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [error, setError] = useState("");

  function set(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function setTitle(value) {
    setValues((v) => ({ ...v, title: value, slug: slugTouched ? v.slug : slugify(value) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!values.title.trim() || !values.slug.trim() || !values.content.trim()) {
      setError("Judul, slug, dan isi artikel wajib diisi.");
      return;
    }
    try {
      await onSubmit({ ...values, slug: slugify(values.slug) });
    } catch (err) {
      setError(err.message || "Gagal menyimpan.");
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-field">
        <label htmlFor="title">Judul Artikel *</label>
        <input id="title" value={values.title} onChange={(e) => setTitle(e.target.value)} placeholder="Tips Memilih Jasa Website Murah" />
      </div>

      <div className="admin-field">
        <label htmlFor="slug">URL Slug *</label>
        <input
          id="slug"
          value={values.slug}
          onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
          placeholder="tips-memilih-jasa-website-murah"
        />
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          URL akhir: tazecode.pages.dev/blog/{slugify(values.slug) || "…"}
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="excerpt">Ringkasan (excerpt)</label>
        <textarea id="excerpt" rows={2} value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Ringkasan singkat, tampil di daftar artikel." />
      </div>

      <ImageUpload label="Gambar Cover (opsional)" value={values.cover_image_url} onChange={(url) => set("cover_image_url", url)} />

      <div className="admin-field">
        <label htmlFor="content">Isi Artikel *</label>
        <textarea id="content" rows={12} value={values.content} onChange={(e) => set("content", e.target.value)} placeholder="Tulis isi artikel. Pisahkan paragraf dengan baris kosong." />
      </div>

      <label className="admin-checkbox">
        <input type="checkbox" checked={!!values.is_published} onChange={(e) => set("is_published", e.target.checked)} />
        Publikasikan (tampil di halaman Blog)
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

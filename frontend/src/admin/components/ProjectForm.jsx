import { useState } from "react";
import CroppedImageUpload from "./CroppedImageUpload";

const EMPTY = {
  slug: "", name: "", category: "", year: "", client: "", role: "", duration: "",
  description: "", problem: "", solution: "", challenges: "", result: "",
  live: "", github: "", thumbnail_url: "", featured: false,
  featuresText: "", techText: ""
};

function toFormState(project) {
  if (!project) return EMPTY;
  return {
    ...EMPTY,
    ...project,
    featuresText: (project.features || []).join("\n"),
    techText: (project.tech || []).join(", ")
  };
}

export default function ProjectForm({ initial, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(() => toFormState(initial));
  const [error, setError] = useState("");

  function set(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!values.slug.trim() || !values.name.trim() || !values.category.trim()) {
      setError("Slug, nama, dan kategori wajib diisi.");
      return;
    }
    const payload = {
      slug: values.slug.trim(),
      name: values.name.trim(),
      category: values.category.trim(),
      year: values.year,
      client: values.client,
      role: values.role,
      duration: values.duration,
      description: values.description,
      problem: values.problem,
      solution: values.solution,
      challenges: values.challenges,
      result: values.result,
      live: values.live,
      github: values.github,
      thumbnail_url: values.thumbnail_url,
      featured: !!values.featured,
      features: values.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
      tech: values.techText.split(",").map((s) => s.trim()).filter(Boolean)
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

      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="slug">Slug (URL) *</label>
          <input id="slug" value={values.slug} onChange={(e) => set("slug", e.target.value)} placeholder="nama-project-unik" />
        </div>
        <div className="admin-field">
          <label htmlFor="name">Nama Project *</label>
          <input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
        </div>
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="category">Kategori *</label>
          <input id="category" value={values.category} onChange={(e) => set("category", e.target.value)} placeholder="E-Commerce, POS, dll" />
        </div>
        <div className="admin-field">
          <label htmlFor="year">Tahun</label>
          <input id="year" value={values.year || ""} onChange={(e) => set("year", e.target.value)} />
        </div>
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="client">Client</label>
          <input id="client" value={values.client || ""} onChange={(e) => set("client", e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="role">Role</label>
          <input id="role" value={values.role || ""} onChange={(e) => set("role", e.target.value)} />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="duration">Durasi</label>
        <input id="duration" value={values.duration || ""} onChange={(e) => set("duration", e.target.value)} placeholder="3 weeks" />
      </div>

      <CroppedImageUpload label="Thumbnail Project" value={values.thumbnail_url} onChange={(url) => set("thumbnail_url", url)} />

      <div className="admin-field">
        <label htmlFor="description">Deskripsi Singkat</label>
        <textarea id="description" rows={2} value={values.description || ""} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="problem">Problem</label>
          <textarea id="problem" rows={3} value={values.problem || ""} onChange={(e) => set("problem", e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="solution">Solution</label>
          <textarea id="solution" rows={3} value={values.solution || ""} onChange={(e) => set("solution", e.target.value)} />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="featuresText">Fitur Utama (satu per baris)</label>
        <textarea id="featuresText" rows={4} value={values.featuresText} onChange={(e) => set("featuresText", e.target.value)} />
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="challenges">Challenges</label>
          <textarea id="challenges" rows={2} value={values.challenges || ""} onChange={(e) => set("challenges", e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="result">Result</label>
          <textarea id="result" rows={2} value={values.result || ""} onChange={(e) => set("result", e.target.value)} />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="techText">Teknologi (pisahkan dengan koma)</label>
        <input id="techText" value={values.techText} onChange={(e) => set("techText", e.target.value)} placeholder="Laravel, MySQL, Tailwind CSS" />
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="live">Live Demo URL</label>
          <input id="live" value={values.live || ""} onChange={(e) => set("live", e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="github">GitHub URL</label>
          <input id="github" value={values.github || ""} onChange={(e) => set("github", e.target.value)} />
        </div>
      </div>

      <label className="admin-checkbox">
        <input type="checkbox" checked={!!values.featured} onChange={(e) => set("featured", e.target.checked)} />
        Tampilkan di Featured Projects (halaman Home)
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

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import ImageUpload from "./ImageUpload";

export default function ProjectGalleryManager({ project, onClose }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api.getProjectImages(project.id)
      .then(setImages)
      .catch(() => setError("Gagal memuat galeri."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [project.id]);

  async function handleAdd(dataUrl) {
    if (!dataUrl) return;
    if (images.length >= 10) {
      setError("Maksimal 10 foto per project.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      await api.addProjectImage(project.id, dataUrl);
      load();
    } catch (err) {
      setError(err.message || "Gagal upload foto.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(img) {
    if (!confirm("Hapus foto ini dari galeri?")) return;
    await api.deleteProjectImage(img.id);
    load();
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Galeri — {project.name}</h2>
        <button className="admin-btn" onClick={onClose}>Tutup</button>
      </div>

      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: -8, marginBottom: 16 }}>
        Foto ini tampil sebagai slider mockup di halaman detail project ({images.length}/10 foto).
      </p>

      {error && <div className="admin-alert">{error}</div>}

      {images.length < 10 && (
        <ImageUpload
          label={uploading ? "Mengunggah…" : "Tambah Foto"}
          value=""
          onChange={handleAdd}
        />
      )}

      {loading ? (
        <div className="admin-loading">Memuat…</div>
      ) : images.length === 0 ? (
        <div className="admin-empty">Belum ada foto galeri.</div>
      ) : (
        <div className="admin-gallery-grid">
          {images.map((img) => (
            <div className="admin-gallery-item" key={img.id}>
              <img src={img.image_url} alt="" />
              <button type="button" className="admin-btn danger" onClick={() => handleDelete(img)}>Hapus</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

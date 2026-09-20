import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import ImageCropper from "./ImageCropper";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

export default function ProjectGalleryManager({ project, onClose }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cropSrc, setCropSrc] = useState(null); // raw image being cropped
  const [editingId, setEditingId] = useState(null); // null = adding new, id = editing existing
  const fileInputRef = useRef(null);

  function load() {
    setLoading(true);
    api.getProjectImages(project.id)
      .then(setImages)
      .catch(() => setError("Gagal memuat galeri."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [project.id]);

  async function handlePickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG/PNG/WebP).");
      return;
    }
    if (images.length >= 10) {
      setError("Maksimal 10 foto per project.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditingId(null);
      setCropSrc(dataUrl);
    } catch (err) {
      setError(err.message || "Gagal membaca file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function startEdit(img) {
    setError("");
    setEditingId(img.id);
    setCropSrc(img.image_url);
  }

  async function handleCropConfirm(croppedDataUrl) {
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.updateProjectImage(editingId, croppedDataUrl);
      } else {
        await api.addProjectImage(project.id, croppedDataUrl);
      }
      setCropSrc(null);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message || "Gagal menyimpan foto.");
    } finally {
      setSaving(false);
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

      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: -8, marginBottom: 16, padding: "0 20px" }}>
        Foto ini tampil sebagai slider mockup di halaman detail project ({images.length}/10 foto). Setiap foto bisa diatur posisi & zoom-nya sebelum disimpan.
      </p>

      {error && <div className="admin-alert">{error}</div>}

      {images.length < 10 && (
        <div className="admin-field" style={{ padding: "0 20px 16px" }}>
          <label>Tambah Foto</label>
          <div className="admin-image-dropzone">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickFile} />
            <span>Klik untuk pilih foto (JPG/PNG) — akan diminta atur crop sebelum disimpan</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">Memuat…</div>
      ) : images.length === 0 ? (
        <div className="admin-empty">Belum ada foto galeri.</div>
      ) : (
        <div className="admin-gallery-grid" style={{ padding: "0 20px 20px" }}>
          {images.map((img) => (
            <div className="admin-gallery-item" key={img.id}>
              <img src={img.image_url} alt="" />
              <div className="admin-gallery-item-actions">
                <button type="button" className="admin-btn" onClick={() => startEdit(img)}>Edit</button>
                <button type="button" className="admin-btn danger" onClick={() => handleDelete(img)}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          saving={saving}
          onCancel={() => { setCropSrc(null); setEditingId(null); }}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

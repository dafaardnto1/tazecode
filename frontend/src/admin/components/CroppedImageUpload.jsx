import { useRef, useState } from "react";
import ImageCropper from "./ImageCropper";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

export default function CroppedImageUpload({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG/PNG/WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Ukuran file maksimal 8MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropSrc(dataUrl);
    } catch (err) {
      setError(err.message || "Gagal membaca file.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleConfirm(croppedDataUrl) {
    onChange(croppedDataUrl);
    setCropSrc(null);
  }

  return (
    <div className="admin-field">
      <label>{label}</label>
      {value ? (
        <div className="admin-image-preview">
          <img src={value} alt="" />
          <div className="admin-row-actions">
            <button type="button" className="admin-btn" onClick={() => setCropSrc(value)}>Atur Ulang Crop/Zoom</button>
            <button type="button" className="admin-btn" onClick={() => inputRef.current?.click()}>Ganti Foto</button>
            <button type="button" className="admin-btn danger" onClick={() => onChange("")}>Hapus Foto</button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </div>
      ) : (
        <div className="admin-image-dropzone">
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} />
          <span>Klik untuk pilih foto (JPG/PNG) — akan diminta atur crop sebelum disimpan</span>
        </div>
      )}
      {error && <div className="admin-field-hint" style={{ color: "#b23b2e" }}>{error}</div>}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspectW={4}
          aspectH={3}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

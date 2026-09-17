import { useRef, useState } from "react";

const MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.75;

// Resizes + compresses the image client-side, then encodes it as a base64
// data URI stored directly in D1. This avoids needing R2 (which requires a
// one-time manual "Enable R2" click in the Cloudflare dashboard) entirely —
// fine for small avatar/thumbnail-sized images at this project's scale.
function fileToCompressedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.onload = () => {
      img.onerror = () => reject(new Error("File bukan gambar yang valid."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
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

    setProcessing(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err.message || "Gagal memproses gambar.");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="admin-field">
      <label>{label}</label>
      {value ? (
        <div className="admin-image-preview">
          <img src={value} alt="" />
          <button type="button" className="admin-btn danger" onClick={() => onChange("")}>Hapus Foto</button>
        </div>
      ) : (
        <div className="admin-image-dropzone">
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} disabled={processing} />
          <span>{processing ? "Memproses…" : "Klik untuk pilih foto (JPG/PNG, otomatis dikompres)"}</span>
        </div>
      )}
      {error && <div className="admin-field-hint" style={{ color: "#b23b2e" }}>{error}</div>}
    </div>
  );
}

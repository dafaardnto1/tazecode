import { useEffect, useRef, useState } from "react";

const STAGE_W = 480;
const JPEG_QUALITY = 0.8;
const OUTPUT_SCALE = 2;

export default function ImageCropper({ src, onCancel, onConfirm, saving, aspectW = 16, aspectH = 10 }) {
  const STAGE_H = Math.round((STAGE_W * aspectH) / aspectW);
  const OUTPUT_W = STAGE_W * OUTPUT_SCALE;
  const OUTPUT_H = STAGE_H * OUTPUT_SCALE;
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const bs = Math.max(STAGE_W / img.naturalWidth, STAGE_H / img.naturalHeight);
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setBaseScale(bs);
      setZoom(1);
      setOffset({ x: (STAGE_W - img.naturalWidth * bs) / 2, y: (STAGE_H - img.naturalHeight * bs) / 2 });
    };
    img.src = src;
  }, [src]);

  function clampOffset(next, scale) {
    if (!natural) return next;
    const dispW = natural.w * scale;
    const dispH = natural.h * scale;
    const minX = Math.min(0, STAGE_W - dispW);
    const minY = Math.min(0, STAGE_H - dispH);
    return {
      x: Math.min(0, Math.max(minX, next.x)),
      y: Math.min(0, Math.max(minY, next.y))
    };
  }

  function handlePointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, offset };
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const scale = baseScale * zoom;
    setOffset(clampOffset({ x: dragRef.current.offset.x + dx, y: dragRef.current.offset.y + dy }, scale));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoomChange(e) {
    const newZoom = Number(e.target.value);
    const scale = baseScale * newZoom;
    setZoom(newZoom);
    setOffset((prev) => clampOffset(prev, scale));
  }

  function handleConfirm() {
    if (!natural) return;
    const scale = baseScale * zoom;
    const cropX = -offset.x / scale;
    const cropY = -offset.y / scale;
    const cropW = STAGE_W / scale;
    const cropH = STAGE_H / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, OUTPUT_W, OUTPUT_H);
      onConfirm(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.src = src;
  }

  const scale = baseScale * zoom;

  return (
    <div className="cropper-overlay">
      <div className="cropper-panel">
        <div className="cropper-title">Atur & Potong Foto</div>
        <div
          className="cropper-stage"
          style={{ width: STAGE_W, height: STAGE_H }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {natural && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: offset.x,
                top: offset.y,
                width: natural.w * scale,
                height: natural.h * scale,
                maxWidth: "none",
                cursor: "grab"
              }}
            />
          )}
        </div>
        <div className="cropper-zoom">
          <span>Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={handleZoomChange} />
        </div>
        <div className="cropper-hint">Geser foto untuk atur posisi, gunakan slider untuk zoom.</div>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn" onClick={onCancel} disabled={saving}>Batal</button>
          <button type="button" className="admin-btn primary" onClick={handleConfirm} disabled={saving || !natural}>
            {saving ? "Menyimpan…" : "Simpan Foto"}
          </button>
        </div>
      </div>
    </div>
  );
}

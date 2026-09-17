import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export default function ProjectGallery({ projectId, projectName }) {
  const [images, setImages] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api.getProjectImages(projectId)
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setImages(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [projectId]);

  if (images.length === 0) return null;

  function scrollBy(dir) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".gallery-mockup");
    const amount = card ? card.offsetWidth + 20 : 340;
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className="project-gallery">
      <div className="project-gallery-head">
        <h3>Galeri Screenshot</h3>
        <div className="project-gallery-arrows">
          <button type="button" className="gallery-arrow" onClick={() => scrollBy(-1)} aria-label="Sebelumnya">‹</button>
          <button type="button" className="gallery-arrow" onClick={() => scrollBy(1)} aria-label="Selanjutnya">›</button>
        </div>
      </div>
      <div className="project-gallery-track" ref={trackRef}>
        {images.map((img) => (
          <div className="gallery-mockup" key={img.id}>
            <div className="gallery-mockup-bar">
              <span className="error-dot" style={{ background: "#ff5f56" }} />
              <span className="error-dot" style={{ background: "#ffbd2e" }} />
              <span className="error-dot" style={{ background: "#27c93f" }} />
            </div>
            <div className="gallery-mockup-screen">
              <img src={img.image_url} alt={projectName} loading="lazy" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

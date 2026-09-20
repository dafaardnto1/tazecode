import { useRef } from "react";

export default function ServicesCarousel({ items }) {
  const trackRef = useRef(null);

  function scrollBy(dir) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".cell");
    const amount = card ? card.offsetWidth + 20 : 320;
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className="services-carousel">
      <div className="services-carousel-track" ref={trackRef}>
        {items.map((item) => (
          <div className="cell" key={item.i}>
            <div className="service-index">{item.i}</div>
            <div className="service-title">{item.title}</div>
            <p className="service-desc">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="services-carousel-arrows">
        <button type="button" className="gallery-arrow" onClick={() => scrollBy(-1)} aria-label="Sebelumnya">‹</button>
        <button type="button" className="gallery-arrow" onClick={() => scrollBy(1)} aria-label="Selanjutnya">›</button>
      </div>
    </div>
  );
}

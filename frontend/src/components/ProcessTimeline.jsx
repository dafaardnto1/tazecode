import { useEffect, useRef, useState } from "react";
import { useProcessSteps } from "../hooks/useApiData";

export default function ProcessTimeline() {
  const { steps } = useProcessSteps();
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh * 0.5;
      const covered = vh * 0.75 - rect.top;
      const pct = Math.min(1, Math.max(0, covered / total));
      setProgress(pct);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const activeCount = Math.round(progress * steps.length);

  return (
    <div className="process-timeline" ref={containerRef}>
      <div className="process-line-track">
        <div className="process-line-fill" style={{ height: `${progress * 100}%` }} />
      </div>
      <div className="process-steps">
        {steps.map((step, i) => (
          <div className={`process-step${i < activeCount ? " active" : ""}`} key={step.id ?? i}>
            <div className="process-dot">{String(i + 1).padStart(2, "0")}</div>
            <div className="process-content">
              <div className="process-title">{step.title}</div>
              <p className="process-desc">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

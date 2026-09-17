export function SkeletonBlock({ width, height = 16, style, className = "" }) {
  return <div className={`skeleton ${className}`} style={{ width, height, ...style }} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-thumb" />
      <div className="skeleton" style={{ width: "70%", height: 18, marginTop: 14 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: i === lines - 1 ? "45%" : "100%", height: 12, marginTop: 8 }} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4, lines = 3 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}

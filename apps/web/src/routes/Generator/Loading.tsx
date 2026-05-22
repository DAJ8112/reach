export function Loading() {
  return (
    <div className="loading-card">
      <div className="loading-head">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="loading-text">Drafting your email…</span>
      </div>
      <div className="shimmer-lines">
        {[92, 78, 100, 64, 88, 70, 40].map((w, i) => (
          <div
            key={i}
            className="shimmer-line"
            style={{ width: w + '%', animationDelay: i * 0.08 + 's' }}
          />
        ))}
      </div>
    </div>
  );
}

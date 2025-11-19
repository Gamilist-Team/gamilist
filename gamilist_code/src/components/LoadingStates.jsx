// Loading state components for better UX

// Skeleton loader for game cards
export function GameCardSkeleton() {
  return (
    <article
      className="card"
      style={{
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "240px",
          background:
            "linear-gradient(90deg, #1b1b25 25%, #2f2f3a 50%, #1b1b25 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite",
          borderRadius: "8px 8px 0 0",
        }}
      />
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            height: "20px",
            background:
              "linear-gradient(90deg, #1b1b25 25%, #2f2f3a 50%, #1b1b25 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite",
            borderRadius: "4px",
            marginBottom: "0.5rem",
          }}
        />
        <div
          style={{
            height: "16px",
            width: "60%",
            background:
              "linear-gradient(90deg, #1b1b25 25%, #2f2f3a 50%, #1b1b25 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite",
            borderRadius: "4px",
          }}
        />
      </div>
    </article>
  );
}

// Grid of skeleton cards
export function GameGridSkeleton({ count = 6 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "1.5rem",
      }}
    >
      {[...Array(count)].map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Simple spinner
export function Spinner({ size = "40px", color = "var(--primary)" }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `4px solid rgba(139, 92, 246, 0.2)`,
        borderTop: `4px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
  );
}

// Full page loading
export function PageLoader({ message = "Loading..." }) {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        color: "var(--muted)",
      }}
    >
      <Spinner />
      <p>{message}</p>
    </div>
  );
}

// Inline loading indicator
export function InlineLoader() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        color: "var(--muted)",
      }}
    >
      <Spinner size="16px" />
      <span>Loading...</span>
    </div>
  );
}

// Add keyframes to global styles
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(style);

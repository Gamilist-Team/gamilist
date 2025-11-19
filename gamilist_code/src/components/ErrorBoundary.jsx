import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "var(--bg)",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              background: "var(--panel)",
              padding: "2rem",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ marginBottom: "1rem" }}>Oops! Something went wrong</h1>
            <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
              We're sorry for the inconvenience. The application encountered an
              unexpected error.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details
                style={{
                  background: "#1b1b25",
                  padding: "1rem",
                  borderRadius: "4px",
                  marginBottom: "2rem",
                  textAlign: "left",
                  fontSize: "0.9rem",
                  color: "#ef4444",
                }}
              >
                <summary style={{ cursor: "pointer", marginBottom: "0.5rem" }}>
                  Error Details (Development Mode)
                </summary>
                <pre
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button className="btn primary" onClick={this.handleReset}>
                Reload Page
              </button>
              <button
                className="btn ghost"
                onClick={() => (window.location.href = "/")}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

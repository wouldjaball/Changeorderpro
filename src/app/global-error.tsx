"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "24px 16px",
          background: "#fff",
          color: "#111",
        }}
      >
        <div style={{ maxWidth: 480, margin: "15vh auto 0" }}>
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#555", margin: "0 0 12px" }}>
            The app hit an unexpected error. You can try again or head back to
            the dashboard.
          </p>
          <pre
            style={{
              background: "#f4f4f5",
              borderRadius: 6,
              padding: 8,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: "0 0 16px",
            }}
          >
            {error.message || "Unknown error"}
            {error.digest ? ` (ref ${error.digest})` : ""}
          </pre>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "#fff",
                fontSize: 15,
              }}
            >
              Try again
            </button>
            <a
              href="/dashboard"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 8,
                background: "#111",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                fontSize: 15,
              }}
            >
              Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

/**
 * Global error boundary — catches errors in the root layout itself.
 * Must include its own <html> and <body> tags since the root layout may have crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a1628",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <svg
              width="40"
              height="40"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="#f87171"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h1 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Sistema temporariamente indisponível
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginTop: "0.75rem", maxWidth: "400px", lineHeight: 1.6 }}>
            Estamos trabalhando para restabelecer o serviço o mais rápido possível.
            Tente novamente em alguns instantes.
          </p>

          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#f5c518",
                color: "#0f2840",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
            <a
              href="/"
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Página inicial
            </a>
          </div>

          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", marginTop: "2rem" }}>
            Contato: suporte@agenciashub.com.br
          </p>
        </div>
      </body>
    </html>
  );
}

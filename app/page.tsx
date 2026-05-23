"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [payload, setPayload] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/utils/generate-quotation/sample")
      .then((r) => r.json())
      .then((j) => setPayload(JSON.stringify(j, null, 2)))
      .catch(() => setPayload("{}"));
  }, []);

  async function downloadPdf() {
    setBusy(true);
    setError(null);
    try {
      const parsed = JSON.parse(payload);
      const res = await fetch("/api/utils/generate-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") || "";
      const m = cd.match(/filename="([^"]+)"/);
      a.download = m ? m[1] : "quotation.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "32px 24px 64px",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, color: "#2f5236" }}>
          Quotation PDF Generator
        </h1>
        <p style={{ marginTop: 6, color: "#6b6b6b" }}>
          POST a JSON payload to <code>/api/utils/generate-quotation</code> and get a downloadable PDF.
        </p>
      </header>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e5dcc3",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <strong>Payload</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                fetch("/api/utils/generate-quotation/sample")
                  .then((r) => r.json())
                  .then((j) => setPayload(JSON.stringify(j, null, 2)));
              }}
              style={btnSecondary}
            >
              Reset sample
            </button>
            <button type="button" onClick={downloadPdf} disabled={busy} style={btnPrimary}>
              {busy ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          style={{
            width: "100%",
            minHeight: 520,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12.5,
            padding: 12,
            border: "1px solid #e5dcc3",
            borderRadius: 6,
            background: "#fbf8f0",
            color: "#1f2a24",
            resize: "vertical",
          }}
          spellCheck={false}
        />
        {error ? (
          <p style={{ marginTop: 10, color: "#b00020", fontSize: 13 }}>{error}</p>
        ) : null}
      </section>

      <section style={{ marginTop: 24, fontSize: 13, color: "#6b6b6b" }}>
        <p>
          <strong>cURL:</strong>
        </p>
        <pre style={{ background: "#fff", border: "1px solid #e5dcc3", padding: 12, borderRadius: 6, overflow: "auto" }}>
{`curl -X POST http://localhost:3000/api/utils/generate-quotation \\
  -H "Content-Type: application/json" \\
  -d @payload.json --output quotation.pdf`}
        </pre>
      </section>
    </main>
  );
}

const btnPrimary: React.CSSProperties = {
  background: "#3f6b43",
  color: "#fff",
  border: "none",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  background: "#fbf8f0",
  color: "#3f6b43",
  border: "1px solid #3f6b43",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  QuotationInput,
  LineItem,
  ExtraCharge,
  PaymentSchedule,
} from "@/lib/types";

const SECTIONS = [
  { id: "company", label: "Company", icon: "🏢" },
  { id: "document", label: "Document", icon: "📄" },
  { id: "client", label: "Client", icon: "👤" },
  { id: "project", label: "Project", icon: "🌱" },
  { id: "items", label: "Items", icon: "📋" },
  { id: "extras", label: "Extras", icon: "🧾" },
  { id: "totals", label: "Totals", icon: "💰" },
  { id: "payment", label: "Payment", icon: "💳" },
  { id: "included", label: "What's Included", icon: "✅" },
  { id: "maintenance", label: "Maintenance", icon: "🛠️" },
  { id: "banking", label: "Banking", icon: "🏦" },
  { id: "terms", label: "Terms", icon: "📜" },
  { id: "signer", label: "Signature", icon: "✍️" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const DRAFT_KEY = "quotation-draft-v1";

function emptyItem(): LineItem {
  return { name: "", description: "", quantity: 0, unit: "", rate: 0 };
}

function emptyState(): QuotationInput {
  return {
    company: { name: "", tagline: "", legalName: "", city: "", website: "" },
    reference: "",
    documentTitle: "ESTIMATE",
    clientName: "",
    clientSubtitle: "",
    date: new Date().toISOString().slice(0, 10),
    validUntil: "",
    validityLabel: "",
    preparedByLabel: "",
    projectType: "",
    projectTitle: "",
    projectSubtitle: "",
    zones: 1,
    items: [emptyItem()],
    extraCharges: [],
    gstPercent: 0,
    paymentSchedule: [],
    whatsIncluded: [],
    maintenanceSupport: { description: "", cost: "" },
    banking: { accountHolder: "", bank: "", accountNo: "", ifsc: "" },
    termsAndConditions: [],
    preparedBy: { name: "", title: "", phone: "", email: "" },
  };
}

function formatNumber(n: number): string {
  if (!isFinite(n)) return "0";
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  if (s.length <= 3) return (n < 0 ? "-" : "") + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return (n < 0 ? "-" : "") + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
}

function calcAmount(it: LineItem): number {
  if (typeof it.amount === "number" && it.amount > 0) return it.amount;
  const q = typeof it.quantity === "number" ? it.quantity : parseFloat(String(it.quantity)) || 0;
  return Math.round(q * (it.rate || 0));
}

// For <input type="number"> — show empty string when value is 0 so the
// placeholder is visible and users don't have to clear a leading "0".
function numVal(n: number | undefined | null): number | "" {
  return !n ? "" : n;
}

export default function Home() {
  const [data, setData] = useState<QuotationInput>(emptyState);
  const [active, setActive] = useState<SectionId>("company");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Autosave draft (debounced via tiny timeout)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [data]);

  // Revoke blob URL on unmount/change
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // ─── Derived totals ───
  const { subtotal, gstAmount, grandTotal } = useMemo(() => {
    const items = data.items || [];
    const extras = data.extraCharges || [];
    const itemsSub = items.reduce((s, it) => s + calcAmount(it), 0);
    const extrasSub = extras.reduce((s, e) => s + (e.amount || 0), 0);
    const sub = itemsSub + extrasSub;
    const gst = Math.round((sub * (data.gstPercent || 0)) / 100);
    return { subtotal: sub, gstAmount: gst, grandTotal: sub + gst };
  }, [data.items, data.extraCharges, data.gstPercent]);

  // ─── Updaters ───
  const set = <K extends keyof QuotationInput>(key: K, value: QuotationInput[K]) =>
    setData((p) => ({ ...p, [key]: value }));

  const setCompany = (patch: Partial<QuotationInput["company"]>) =>
    setData((p) => ({ ...p, company: { ...p.company, ...patch } }));

  const setBank = (patch: Partial<NonNullable<QuotationInput["banking"]>>) =>
    setData((p) => ({
      ...p,
      banking: { ...(p.banking ?? { accountHolder: "", bank: "", accountNo: "", ifsc: "" }), ...patch },
    }));

  const setMaintenance = (patch: Partial<NonNullable<QuotationInput["maintenanceSupport"]>>) =>
    setData((p) => ({
      ...p,
      maintenanceSupport: { ...(p.maintenanceSupport ?? { description: "", cost: "" }), ...patch },
    }));

  const setSigner = (patch: Partial<NonNullable<QuotationInput["preparedBy"]>>) =>
    setData((p) => ({
      ...p,
      preparedBy: { ...(p.preparedBy ?? { name: "" }), ...patch },
    }));

  // Item helpers
  const updateItem = (i: number, patch: Partial<LineItem>) =>
    setData((p) => {
      const next = [...(p.items || [])];
      next[i] = { ...next[i], ...patch };
      return { ...p, items: next };
    });
  const addItem = () => setData((p) => ({ ...p, items: [...(p.items || []), emptyItem()] }));
  const removeItem = (i: number) =>
    setData((p) => ({ ...p, items: (p.items || []).filter((_, idx) => idx !== i) }));

  // Extras helpers
  const updateExtra = (i: number, patch: Partial<ExtraCharge>) =>
    setData((p) => {
      const next = [...(p.extraCharges || [])];
      next[i] = { ...next[i], ...patch };
      return { ...p, extraCharges: next };
    });
  const addExtra = () =>
    setData((p) => ({ ...p, extraCharges: [...(p.extraCharges || []), { label: "", amount: 0 }] }));
  const removeExtra = (i: number) =>
    setData((p) => ({ ...p, extraCharges: (p.extraCharges || []).filter((_, idx) => idx !== i) }));

  // Payment schedule
  const updateSched = (i: number, patch: Partial<PaymentSchedule>) =>
    setData((p) => {
      const next = [...(p.paymentSchedule || [])];
      next[i] = { ...next[i], ...patch };
      return { ...p, paymentSchedule: next };
    });
  const addSched = () =>
    setData((p) => ({ ...p, paymentSchedule: [...(p.paymentSchedule || []), { percent: 0, label: "" }] }));
  const removeSched = (i: number) =>
    setData((p) => ({ ...p, paymentSchedule: (p.paymentSchedule || []).filter((_, idx) => idx !== i) }));

  // String arrays
  const updateStrArr = (key: "whatsIncluded" | "termsAndConditions", i: number, value: string) =>
    setData((p) => {
      const next = [...(p[key] || [])];
      next[i] = value;
      return { ...p, [key]: next };
    });
  const addStrArr = (key: "whatsIncluded" | "termsAndConditions") =>
    setData((p) => ({ ...p, [key]: [...(p[key] || []), ""] }));
  const removeStrArr = (key: "whatsIncluded" | "termsAndConditions", i: number) =>
    setData((p) => ({ ...p, [key]: (p[key] || []).filter((_, idx) => idx !== i) }));

  // ─── Sample loader ───
  const loadSample = async () => {
    try {
      const r = await fetch("/api/utils/generate-quotation/sample");
      const j = await r.json();
      setData(j);
      setSuccess("Sample data loaded.");
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Failed to load sample.");
    }
  };

  // ─── Reset ───
  const resetForm = () => {
    if (!confirm("Clear the form and start fresh?")) return;
    setData(emptyState());
    setPdfUrl(null);
    setSubmitted(false);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  // ─── Validate ───
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!data.company.name.trim()) errs.push("Company name");
    if (!data.reference.trim()) errs.push("Reference number");
    if (!data.clientName.trim()) errs.push("Client name");
    if (!data.date.trim()) errs.push("Date");
    if (!data.projectTitle.trim()) errs.push("Project title");
    const validItems = (data.items || []).filter((it) => it.name.trim());
    if (validItems.length === 0) errs.push("At least one item with a name");
    return errs;
  }, [data]);

  // ─── Submit ───
  const generate = async () => {
    setError(null);
    setSuccess(null);
    setSubmitted(true);
    if (validationErrors.length > 0) {
      setError(`Please fill: ${validationErrors.join(", ")}`);
      // Try to scroll to first invalid section
      const target =
        !data.company.name.trim() ? "company" :
        !data.reference.trim() ? "document" :
        !data.clientName.trim() ? "client" :
        !data.projectTitle.trim() ? "project" : "items";
      goto(target as SectionId);
      return;
    }
    setBusy(true);
    try {
      const cleaned: QuotationInput = {
        ...data,
        whatsIncluded: (data.whatsIncluded || []).filter((s) => s.trim()),
        termsAndConditions: (data.termsAndConditions || []).filter((s) => s.trim()),
        paymentSchedule: (data.paymentSchedule || []).filter((p) => p.percent > 0 || p.label.trim()),
        extraCharges: (data.extraCharges || []).filter((e) => e.label.trim() || e.amount > 0),
        items: (data.items || []).filter((it) => it.name.trim()),
      };
      const res = await fetch("/api/utils/generate-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setSuccess("PDF generated. Preview below — use the Download button to save.");
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${(data.documentTitle || "quotation").toLowerCase()}-${(data.clientName || "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ─── Nav scroll ───
  const goto = (id: SectionId) => {
    setActive(id);
    const el = document.getElementById(`sec-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Active section observer
  useEffect(() => {
    const sections = SECTIONS.map((s) => document.getElementById(`sec-${s.id}`)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.id.replace("sec-", "") as SectionId;
          setActive(id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const isInvalid = (cond: boolean) => submitted && cond;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <span className="sidebar__logo-mark">📄</span>
            Quotation Builder
          </div>
          <p className="sidebar__tagline">Professional PDF generator</p>
        </div>
        <nav className="sidebar__nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`sidebar__nav-item ${active === s.id ? "sidebar__nav-item--active" : ""}`}
              onClick={() => goto(s.id)}
            >
              <span className="sidebar__nav-icon">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar__foot">
          Fields with <span style={{ color: "#ffd9d9" }}>*</span> are required.
          Your draft is saved in this browser as you type.
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar__title">
            <h1>Build a Quotation</h1>
            <p>Fill in the details below and download a polished PDF.</p>
          </div>
          <div className="topbar__actions">
            <div className="totalsPill">
              Grand total <strong>Rs. {formatNumber(grandTotal)}</strong>
            </div>
            <button type="button" className="btn btn--soft" onClick={loadSample}>
              ✨ Sample
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              ↺ Reset
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={generate}
              disabled={busy}
            >
              {busy ? "Generating…" : "Generate PDF →"}
            </button>
          </div>
        </div>

        <div className="content">
          {error ? <div className="alert alert--error">{error}</div> : null}
          {success ? <div className="alert alert--success">{success}</div> : null}

          {/* ───────── Company ───────── */}
          <section id="sec-company" className="card">
            <div className="card__head">
              <div className="card__icon">🏢</div>
              <div>
                <h2 className="card__title">Company Header</h2>
                <p className="card__subtitle">Shown at the top of every page of the PDF.</p>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="field__label">Company name <span className="req">*</span></label>
                <input
                  className={`input ${isInvalid(!data.company.name.trim()) ? "invalid" : ""}`}
                  value={data.company.name}
                  onChange={(e) => setCompany({ name: e.target.value })}
                  placeholder="e.g. KarmYog Vatika"
                />
              </div>
              <div className="field">
                <label className="field__label">Tagline</label>
                <input
                  className="input"
                  value={data.company.tagline || ""}
                  onChange={(e) => setCompany({ tagline: e.target.value })}
                  placeholder="e.g. Biophilic Learning Garden Initiative"
                />
              </div>
              <div className="field">
                <label className="field__label">Legal name</label>
                <input
                  className="input"
                  value={data.company.legalName || ""}
                  onChange={(e) => setCompany({ legalName: e.target.value })}
                  placeholder="Shown in the page-2 footer"
                />
              </div>
              <div className="field">
                <label className="field__label">City</label>
                <input
                  className="input"
                  value={data.company.city || ""}
                  onChange={(e) => setCompany({ city: e.target.value })}
                  placeholder="e.g. Kolkata"
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="field__label">Website</label>
                <input
                  className="input"
                  value={data.company.website || ""}
                  onChange={(e) => setCompany({ website: e.target.value })}
                  placeholder="e.g. www.example.com"
                />
              </div>
            </div>
          </section>

          {/* ───────── Document ───────── */}
          <section id="sec-document" className="card">
            <div className="card__head">
              <div className="card__icon">📄</div>
              <div>
                <h2 className="card__title">Document Details</h2>
                <p className="card__subtitle">Title, reference number, and validity.</p>
              </div>
            </div>
            <div className="grid grid-3">
              <div className="field">
                <label className="field__label">Document title</label>
                <select
                  className="select"
                  value={data.documentTitle || "ESTIMATE"}
                  onChange={(e) => set("documentTitle", e.target.value)}
                >
                  <option>ESTIMATE</option>
                  <option>QUOTATION</option>
                  <option>PROPOSAL</option>
                  <option>INVOICE</option>
                </select>
              </div>
              <div className="field">
                <label className="field__label">Reference no. <span className="req">*</span></label>
                <input
                  className={`input ${isInvalid(!data.reference.trim()) ? "invalid" : ""}`}
                  value={data.reference}
                  onChange={(e) => set("reference", e.target.value)}
                  placeholder="e.g. KV/EST/2026-05"
                />
              </div>
              <div className="field">
                <label className="field__label">Prepared by (label)</label>
                <input
                  className="input"
                  value={data.preparedByLabel || ""}
                  onChange={(e) => set("preparedByLabel", e.target.value)}
                  placeholder="e.g. Team / Department"
                />
              </div>
              <div className="field">
                <label className="field__label">Date <span className="req">*</span></label>
                <input
                  type="date"
                  className={`input ${isInvalid(!data.date.trim()) ? "invalid" : ""}`}
                  value={parseToDateInput(data.date)}
                  onChange={(e) => set("date", formatPrettyDate(e.target.value))}
                />
              </div>
              <div className="field">
                <label className="field__label">Valid until</label>
                <input
                  type="date"
                  className="input"
                  value={parseToDateInput(data.validUntil || "")}
                  onChange={(e) => set("validUntil", formatPrettyDate(e.target.value))}
                />
              </div>
              <div className="field">
                <label className="field__label">Validity label</label>
                <input
                  className="input"
                  value={data.validityLabel || ""}
                  onChange={(e) => set("validityLabel", e.target.value)}
                  placeholder="e.g. 30 days"
                />
              </div>
            </div>
          </section>

          {/* ───────── Client ───────── */}
          <section id="sec-client" className="card">
            <div className="card__head">
              <div className="card__icon">👤</div>
              <div>
                <h2 className="card__title">Client</h2>
                <p className="card__subtitle">Who the quotation is prepared for.</p>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="field__label">Client name <span className="req">*</span></label>
                <input
                  className={`input ${isInvalid(!data.clientName.trim()) ? "invalid" : ""}`}
                  value={data.clientName}
                  onChange={(e) => set("clientName", e.target.value)}
                  placeholder="e.g. Ms. Debopriya Ghosh"
                />
              </div>
              <div className="field">
                <label className="field__label">Subtitle</label>
                <input
                  className="input"
                  value={data.clientSubtitle || ""}
                  onChange={(e) => set("clientSubtitle", e.target.value)}
                  placeholder="e.g. Location / brief context"
                />
              </div>
            </div>
          </section>

          {/* ───────── Project ───────── */}
          <section id="sec-project" className="card">
            <div className="card__head">
              <div className="card__icon">🌱</div>
              <div>
                <h2 className="card__title">Project Overview</h2>
                <p className="card__subtitle">Headline shown in the project box.</p>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="field__label">Project title <span className="req">*</span></label>
                <input
                  className={`input ${isInvalid(!data.projectTitle.trim()) ? "invalid" : ""}`}
                  value={data.projectTitle}
                  onChange={(e) => set("projectTitle", e.target.value)}
                  placeholder="e.g. Bamboo Structure Balcony Biophilic Transformation"
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="field__label">Project subtitle</label>
                <input
                  className="input"
                  value={data.projectSubtitle || ""}
                  onChange={(e) => set("projectSubtitle", e.target.value)}
                  placeholder="One-line description"
                />
              </div>
              <div className="field">
                <label className="field__label">Project type</label>
                <input
                  className="input"
                  value={data.projectType || ""}
                  onChange={(e) => set("projectType", e.target.value)}
                  placeholder="Shown in Document Details"
                />
              </div>
              <div className="field">
                <label className="field__label">Zones</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={data.zones ?? 1}
                  onChange={(e) => set("zones", Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </section>

          {/* ───────── Items ───────── */}
          <section id="sec-items" className="card">
            <div className="card__head">
              <div className="card__icon">📋</div>
              <div>
                <h2 className="card__title">Line Items <span className="muted small">— amounts auto-calc from qty × rate</span></h2>
                <p className="card__subtitle">Add one row per product, service, or material.</p>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="itemsTable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ minWidth: 180 }}>Item</th>
                    <th style={{ minWidth: 180 }}>Description</th>
                    <th className="num" style={{ width: 80 }}>Qty</th>
                    <th style={{ width: 80 }}>Unit</th>
                    <th className="num" style={{ width: 100 }}>Rate</th>
                    <th className="num" style={{ width: 110 }}>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items || []).map((it, i) => (
                    <tr key={i}>
                      <td className="idx">{i + 1}</td>
                      <td>
                        <input
                          className={`input ${submitted && (data.items || []).filter((x) => x.name.trim()).length === 0 && !it.name.trim() ? "invalid" : ""}`}
                          value={it.name}
                          onChange={(e) => updateItem(i, { name: e.target.value })}
                          placeholder="Item name"
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={it.description || ""}
                          onChange={(e) => updateItem(i, { description: e.target.value })}
                          placeholder="Description"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="input"
                          style={{ textAlign: "right" }}
                          placeholder="0"
                          value={numVal(typeof it.quantity === "number" ? it.quantity : parseFloat(String(it.quantity)) || 0)}
                          onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={it.unit || ""}
                          onChange={(e) => updateItem(i, { unit: e.target.value })}
                          placeholder="pcs / sqft"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="input"
                          style={{ textAlign: "right" }}
                          placeholder="0"
                          value={numVal(it.rate)}
                          onChange={(e) => updateItem(i, { rate: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="amount">Rs. {formatNumber(calcAmount(it))}</td>
                      <td className="actions">
                        <button
                          type="button"
                          className="btn--icon"
                          title="Remove row"
                          disabled={(data.items || []).length <= 1}
                          onClick={() => removeItem(i)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tableFoot">
              <button type="button" className="btn btn--ghost" onClick={addItem}>
                + Add item
              </button>
              <div className="muted small">
                Items subtotal: <strong>Rs. {formatNumber((data.items || []).reduce((s, it) => s + calcAmount(it), 0))}</strong>
              </div>
            </div>
          </section>

          {/* ───────── Extras ───────── */}
          <section id="sec-extras" className="card">
            <div className="card__head">
              <div className="card__icon">🧾</div>
              <div>
                <h2 className="card__title">Extra Charges</h2>
                <p className="card__subtitle">Installation, transport, labour bundles — shown as their own rows.</p>
              </div>
            </div>
            {(data.extraCharges || []).length === 0 ? (
              <p className="muted small" style={{ marginTop: 0 }}>No extras yet.</p>
            ) : (
              (data.extraCharges || []).map((ex, i) => (
                <div className="row" key={i}>
                  <div className="grid grid-2">
                    <input
                      className="input"
                      placeholder="Label (e.g. Installation & Setup)"
                      value={ex.label}
                      onChange={(e) => updateExtra(i, { label: e.target.value })}
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      className="input"
                      placeholder="Amount"
                      value={numVal(ex.amount)}
                      onChange={(e) => updateExtra(i, { amount: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <button type="button" className="btn--icon" onClick={() => removeExtra(i)} title="Remove">✕</button>
                </div>
              ))
            )}
            <button type="button" className="btn btn--ghost" onClick={addExtra} style={{ marginTop: 8 }}>
              + Add extra charge
            </button>
          </section>

          {/* ───────── Totals ───────── */}
          <section id="sec-totals" className="card">
            <div className="card__head">
              <div className="card__icon">💰</div>
              <div>
                <h2 className="card__title">Tax & Totals</h2>
                <p className="card__subtitle">Live preview of what the PDF will show.</p>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="field__label">GST percent</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  placeholder="0"
                  value={numVal(data.gstPercent)}
                  onChange={(e) => set("gstPercent", Number(e.target.value) || 0)}
                />
                <div className="field__hint">Set to 0 to hide GST in the PDF.</div>
              </div>
              <div className="totalsBox">
                <div className="row__t"><span className="muted">Subtotal</span><span>Rs. {formatNumber(subtotal)}</span></div>
                {data.gstPercent ? (
                  <div className="row__t"><span className="muted">GST ({data.gstPercent}%)</span><span>Rs. {formatNumber(gstAmount)}</span></div>
                ) : null}
                <div className="row__t total"><span>Grand Total</span><span>Rs. {formatNumber(grandTotal)}</span></div>
              </div>
            </div>
          </section>

          {/* ───────── Payment Schedule ───────── */}
          <section id="sec-payment" className="card">
            <div className="card__head">
              <div className="card__icon">💳</div>
              <div>
                <h2 className="card__title">Payment Schedule</h2>
                <p className="card__subtitle">Stages shown on page 2. Percentages should sum to 100.</p>
              </div>
            </div>
            {(data.paymentSchedule || []).length === 0 ? (
              <p className="muted small" style={{ marginTop: 0 }}>No stages yet.</p>
            ) : (
              (data.paymentSchedule || []).map((s, i) => (
                <div className="row__multi" key={i}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="input"
                    placeholder="%"
                    value={numVal(s.percent)}
                    onChange={(e) => updateSched(i, { percent: Number(e.target.value) || 0 })}
                  />
                  <input
                    className="input"
                    placeholder="Label (e.g. Upon Confirmation)"
                    value={s.label}
                    onChange={(e) => updateSched(i, { label: e.target.value })}
                  />
                  <button type="button" className="btn--icon" onClick={() => removeSched(i)} title="Remove">✕</button>
                </div>
              ))
            )}
            <div className="tableFoot">
              <button type="button" className="btn btn--ghost" onClick={addSched}>+ Add stage</button>
              {(data.paymentSchedule || []).length > 0 ? (
                <div className="muted small">
                  Total: <strong>{(data.paymentSchedule || []).reduce((s, p) => s + (p.percent || 0), 0)}%</strong>
                </div>
              ) : null}
            </div>
          </section>

          {/* ───────── What's Included ───────── */}
          <section id="sec-included" className="card">
            <div className="card__head">
              <div className="card__icon">✅</div>
              <div>
                <h2 className="card__title">What&apos;s Included</h2>
                <p className="card__subtitle">Bullet list shown on page 2.</p>
              </div>
            </div>
            {(data.whatsIncluded || []).map((line, i) => (
              <div className="row" key={i}>
                <input
                  className="input"
                  value={line}
                  onChange={(e) => updateStrArr("whatsIncluded", i, e.target.value)}
                  placeholder="e.g. Professional installation and site cleanup"
                />
                <button type="button" className="btn--icon" onClick={() => removeStrArr("whatsIncluded", i)} title="Remove">✕</button>
              </div>
            ))}
            <button type="button" className="btn btn--ghost" onClick={() => addStrArr("whatsIncluded")} style={{ marginTop: 8 }}>
              + Add line
            </button>
          </section>

          {/* ───────── Maintenance ───────── */}
          <section id="sec-maintenance" className="card">
            <div className="card__head">
              <div className="card__icon">🛠️</div>
              <div>
                <h2 className="card__title">Maintenance Support</h2>
                <p className="card__subtitle">Optional — appears beside the What&apos;s Included block.</p>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="field__label">Cost label</label>
                <input
                  className="input"
                  value={data.maintenanceSupport?.cost || ""}
                  onChange={(e) => setMaintenance({ cost: e.target.value })}
                  placeholder="e.g. Rs. 1,500/month (optional)"
                />
              </div>
              <div className="field">
                <label className="field__label">Description</label>
                <textarea
                  className="textarea"
                  value={data.maintenanceSupport?.description || ""}
                  onChange={(e) => setMaintenance({ description: e.target.value })}
                  placeholder="Brief description of the maintenance offering"
                />
              </div>
            </div>
          </section>

          {/* ───────── Banking ───────── */}
          <section id="sec-banking" className="card">
            <div className="card__head">
              <div className="card__icon">🏦</div>
              <div>
                <h2 className="card__title">Banking Details</h2>
                <p className="card__subtitle">Shown in a box on page 2 alongside a QR placeholder.</p>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="field__label">Account holder</label>
                <input
                  className="input"
                  value={data.banking?.accountHolder || ""}
                  onChange={(e) => setBank({ accountHolder: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label">Bank &amp; branch</label>
                <input
                  className="input"
                  value={data.banking?.bank || ""}
                  onChange={(e) => setBank({ bank: e.target.value })}
                  placeholder="e.g. ICICI Bank, R.N. Mukherjee Road"
                />
              </div>
              <div className="field">
                <label className="field__label">Account number</label>
                <input
                  className="input"
                  value={data.banking?.accountNo || ""}
                  onChange={(e) => setBank({ accountNo: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label">IFSC code</label>
                <input
                  className="input"
                  value={data.banking?.ifsc || ""}
                  onChange={(e) => setBank({ ifsc: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* ───────── Terms ───────── */}
          <section id="sec-terms" className="card">
            <div className="card__head">
              <div className="card__icon">📜</div>
              <div>
                <h2 className="card__title">Terms &amp; Conditions</h2>
                <p className="card__subtitle">Bullet list at the bottom of page 2.</p>
              </div>
            </div>
            {(data.termsAndConditions || []).map((line, i) => (
              <div className="row" key={i}>
                <textarea
                  className="textarea"
                  rows={2}
                  value={line}
                  onChange={(e) => updateStrArr("termsAndConditions", i, e.target.value)}
                  placeholder="e.g. 50% payment upon confirmation, balance prior to dispatch."
                />
                <button type="button" className="btn--icon" onClick={() => removeStrArr("termsAndConditions", i)} title="Remove">✕</button>
              </div>
            ))}
            <button type="button" className="btn btn--ghost" onClick={() => addStrArr("termsAndConditions")} style={{ marginTop: 8 }}>
              + Add clause
            </button>
          </section>

          {/* ───────── Signer ───────── */}
          <section id="sec-signer" className="card">
            <div className="card__head">
              <div className="card__icon">✍️</div>
              <div>
                <h2 className="card__title">Signature Block</h2>
                <p className="card__subtitle">Footer of page 2.</p>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="field__label">Name</label>
                <input
                  className="input"
                  value={data.preparedBy?.name || ""}
                  onChange={(e) => setSigner({ name: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label">Title</label>
                <input
                  className="input"
                  value={data.preparedBy?.title || ""}
                  onChange={(e) => setSigner({ title: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label">Phone</label>
                <input
                  className="input"
                  value={data.preparedBy?.phone || ""}
                  onChange={(e) => setSigner({ phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={data.preparedBy?.email || ""}
                  onChange={(e) => setSigner({ email: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* ───────── Preview ───────── */}
          <div ref={previewRef}>
            {pdfUrl ? (
              <div className="preview">
                <div className="preview__bar">
                  <span>Generated PDF preview</span>
                  <button type="button" className="btn btn--primary" onClick={downloadPdf}>
                    ⬇ Download
                  </button>
                </div>
                <iframe className="preview__frame" src={pdfUrl} title="Quotation PDF" />
              </div>
            ) : (
              <div className="muted small" style={{ textAlign: "center", padding: "16px" }}>
                Click <strong>Generate PDF</strong> to preview your quotation here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Convert pretty "23 May 2026" → ISO date input value if possible
function parseToDateInput(s: string): string {
  if (!s) return "";
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatPrettyDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

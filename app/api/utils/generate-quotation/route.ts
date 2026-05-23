import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotationPDF } from "@/lib/QuotationPDF";
import type { QuotationInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validate(body: unknown): { ok: true; data: QuotationInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body must be a JSON object" };
  const b = body as Partial<QuotationInput>;
  if (!b.company || !b.company.name) return { ok: false, error: "company.name is required" };
  if (!b.reference) return { ok: false, error: "reference is required" };
  if (!b.clientName) return { ok: false, error: "clientName is required" };
  if (!b.date) return { ok: false, error: "date is required" };
  if (!b.projectTitle) return { ok: false, error: "projectTitle is required" };
  if (!Array.isArray(b.items) || b.items.length === 0) {
    return { ok: false, error: "items must be a non-empty array" };
  }
  for (let i = 0; i < b.items.length; i++) {
    const it = b.items[i];
    if (!it || typeof it !== "object") return { ok: false, error: `items[${i}] invalid` };
    if (!it.name) return { ok: false, error: `items[${i}].name required` };
    if (it.quantity === undefined) return { ok: false, error: `items[${i}].quantity required` };
    if (typeof it.rate !== "number") return { ok: false, error: `items[${i}].rate must be a number` };
  }
  return { ok: true, data: b as QuotationInput };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "quotation";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const buffer = await renderToBuffer(
      React.createElement(QuotationPDF, { data: result.data }),
    );
    const filename = `${slugify(result.data.documentTitle || "quotation")}-${slugify(result.data.clientName)}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to render PDF", detail: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: "POST a JSON body matching QuotationInput. See README for sample.",
  });
}

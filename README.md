# Quotation PDF Generator

Next.js (App Router) + `@react-pdf/renderer` utility that generates a downloadable Quotation/Estimate PDF matching a fixed template (header, prepared-for, project overview, items table, totals, payment schedule, banking, terms, signature footer).

Inspired by https://github.com/whyharshit/-PDF-Generator-Quotation and styled to match the reference under `pdf-docs-refs/`.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — edit the JSON payload and click **Download PDF**.

## API

`POST /api/utils/generate-quotation`

Body: `application/json` matching `QuotationInput` (see `lib/types.ts`).
Response: `application/pdf` (binary, with `Content-Disposition: attachment`).

`GET /api/utils/generate-quotation/sample` — returns a sample JSON payload.

### Required fields

- `company.name`
- `reference`
- `clientName`
- `date`
- `projectTitle`
- `items[]` with `name`, `quantity`, `rate`

### Example

```bash
curl -X POST http://localhost:3000/api/utils/generate-quotation \
  -H "Content-Type: application/json" \
  -d @payload.json --output quotation.pdf
```

### Minimal payload

```json
{
  "company": { "name": "Acme Co." },
  "reference": "ACME/Q/2026-01",
  "clientName": "Mr. John Doe",
  "date": "23 May 2026",
  "projectTitle": "Website Redesign",
  "items": [
    { "name": "Design", "quantity": 1, "unit": "lot", "rate": 50000 },
    { "name": "Development", "quantity": 40, "unit": "hrs", "rate": 1500 }
  ],
  "gstPercent": 18,
  "paymentSchedule": [
    { "percent": 50, "label": "Upon Confirmation" },
    { "percent": 50, "label": "Upon Completion" }
  ]
}
```

## Acceptance

- POST JSON → returns PDF download
- Layout matches the reference template (cream/green palette, 2 pages)
- Handles single or multiple items, optional GST, optional payment schedule
- PDF opens correctly in any standard viewer (Acrobat, Chrome, Edge, macOS Preview)

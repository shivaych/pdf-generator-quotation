import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { QuotationInput, LineItem } from "./types";
import { formatINR, rupeesInWords } from "./numberToWords";

const COLORS = {
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  accent: "#F59E0B",
  cream: "#F1F5F9",
  creamSoft: "#F8FAFC",
  border: "#E2E8F0",
  textDark: "#0F172A",
  textMuted: "#64748B",
  tableHeader: "#4F46E5",
  rowAlt: "#F8FAFC",
  divider: "#CBD5E1",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 56,
    paddingHorizontal: 36,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: COLORS.textDark,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoText: {
    fontSize: 9,
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
  },
  brandName: {
    fontSize: 20,
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  brandTag: {
    fontSize: 7.5,
    color: COLORS.textMuted,
    letterSpacing: 2.5,
    marginTop: 2,
  },
  headerRight: { alignItems: "flex-end" },
  docTitle: {
    fontSize: 18,
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  docRef: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: 16,
  },

  // Two column block (Prepared For / Estimate Details)
  twoCol: { flexDirection: "row", marginBottom: 14 },
  colHalf: { width: "50%", paddingRight: 12 },
  sectionLabel: {
    fontSize: 8.5,
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  clientSubtitle: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailKey: {
    width: 80,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textDark,
  },
  detailVal: {
    flex: 1,
    fontSize: 9,
    color: COLORS.textDark,
  },

  // Project overview
  overviewLabel: {
    fontSize: 8.5,
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  overviewBox: {
    backgroundColor: COLORS.creamSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 9,
    color: COLORS.textMuted,
  },

  // Stats row
  statsRow: { flexDirection: "row", marginBottom: 16 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 4 },
  statValueSmall: { fontSize: 16, color: COLORS.textDark, fontFamily: "Helvetica" },
  statValueLarge: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
  },
  statLabel: {
    fontSize: 7.5,
    color: COLORS.accent,
    letterSpacing: 2,
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.tableHeader,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  th: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    alignItems: "flex-start",
  },
  tableRowAlt: {
    backgroundColor: "#FFFFFF",
  },
  td: {
    fontSize: 9,
    color: COLORS.textDark,
  },
  tdBold: {
    fontSize: 9,
    color: COLORS.textDark,
    fontFamily: "Helvetica-Bold",
  },
  // column widths
  colNo: { width: "5%" },
  colItem: { width: "26%", paddingRight: 6 },
  colDesc: { width: "32%", paddingRight: 6, color: COLORS.textMuted },
  colQty: { width: "12%", textAlign: "right", paddingRight: 6 },
  colRate: { width: "11%", textAlign: "right", paddingRight: 6 },
  colAmt: { width: "14%", textAlign: "right" },

  installRow: {
    flexDirection: "row",
    backgroundColor: COLORS.creamSoft,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },

  // Total estimate box
  totalBox: {
    backgroundColor: COLORS.creamSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 14,
    marginTop: 18,
    flexDirection: "row",
  },
  totalLeft: { flex: 1, paddingRight: 12 },
  totalRight: { width: 200, alignItems: "flex-end" },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  totalWords: { fontSize: 9, color: COLORS.textMuted },
  totalLine: { flexDirection: "row", justifyContent: "space-between", width: 200, marginBottom: 2 },
  totalKey: { fontSize: 9, color: COLORS.textMuted },
  totalVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.textDark },
  grandTotal: { fontSize: 16, fontFamily: "Helvetica-Bold", color: COLORS.primary, marginTop: 4 },

  // Footer
  pageFooter: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 8,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    fontFamily: "Helvetica-Bold",
  },

  // ============ Page 2 ============
  payHeading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textDark,
    marginBottom: 10,
  },
  payRow: { flexDirection: "row", marginBottom: 18 },
  payCard: {
    flex: 1,
    marginRight: 10,
    backgroundColor: COLORS.creamSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
  },
  payCardLast: { marginRight: 0 },
  payPercent: { fontSize: 20, fontFamily: "Helvetica-Bold", color: COLORS.primary },
  payAmount: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLORS.textDark, marginTop: 6 },
  payNote: { fontSize: 8.5, color: COLORS.textMuted, marginTop: 4 },

  splitRow: { flexDirection: "row", marginBottom: 20 },
  splitCol: { width: "50%", paddingRight: 12 },

  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bulletDash: { width: 10, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 9, color: COLORS.textDark },

  maintenanceDesc: { fontSize: 9, color: COLORS.textMuted, marginBottom: 10 },
  maintenanceCost: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLORS.primary },

  bankBox: {
    backgroundColor: COLORS.creamSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
    flexDirection: "row",
  },
  bankLeft: { flex: 1 },
  bankRight: { width: 90, alignItems: "center" },
  bankHeading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  bankRow: { flexDirection: "row", marginBottom: 3 },
  bankKey: {
    width: 90,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textDark,
  },
  bankVal: { flex: 1, fontSize: 9, color: COLORS.textMuted },
  qrLabel: { fontSize: 7, color: COLORS.textMuted, marginBottom: 4 },
  qrBox: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  qrInner: { fontSize: 6, color: COLORS.textMuted },

  termsHeading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },

  bottomFooter: {
    position: "absolute",
    bottom: 56,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: COLORS.divider,
    paddingTop: 8,
  },
  signerName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.textDark },
  signerSub: { fontSize: 8.5, color: COLORS.textMuted, marginTop: 2 },
  signerContact: { fontSize: 8.5, color: COLORS.textMuted, marginTop: 2 },
  companyRight: { alignItems: "flex-end" },
  companyRightName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.primary },
  companyRightLegal: { fontSize: 8.5, color: COLORS.textMuted, marginTop: 2 },
  companyRightSite: { fontSize: 8.5, color: COLORS.textMuted, marginTop: 2 },
});

function Header({ company, docTitle, reference }: {
  company: QuotationInput["company"];
  docTitle: string;
  reference: string;
}) {
  return (
    <>
      <View style={styles.headerRow} fixed>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>
              {company.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.brandName}>{company.name}</Text>
            {company.tagline ? (
              <Text style={styles.brandTag}>{company.tagline.toUpperCase()}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.docTitle}>{docTitle}</Text>
          <Text style={styles.docRef}>Ref: {reference}</Text>
        </View>
      </View>
      <View style={styles.headerDivider} fixed />
    </>
  );
}

function PageFooter({ reference, page, total }: { reference: string; page: number; total: number }) {
  return (
    <Text style={styles.pageFooter} fixed>
      PAGE {page} OF {total} - {reference}
    </Text>
  );
}

function calcItemAmount(item: LineItem): number {
  if (typeof item.amount === "number") return item.amount;
  const qty = typeof item.quantity === "number" ? item.quantity : parseFloat(String(item.quantity)) || 0;
  return Math.round(qty * item.rate);
}

export function QuotationPDF({ data }: { data: QuotationInput }) {
  const items = data.items || [];
  const itemsSubtotal = items.reduce((sum, it) => sum + calcItemAmount(it), 0);
  const extras = data.extraCharges || [];
  const extrasSubtotal = extras.reduce((s, e) => s + (e.amount || 0), 0);
  const subtotal = itemsSubtotal + extrasSubtotal;
  const gstPercent = typeof data.gstPercent === "number" ? data.gstPercent : 0;
  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const grandTotal = subtotal + gstAmount;
  const totalPages = 2;
  const docTitle = (data.documentTitle || "ESTIMATE").toUpperCase();

  const schedule = (data.paymentSchedule && data.paymentSchedule.length > 0
    ? data.paymentSchedule
    : []
  ).map((p) => ({
    ...p,
    amount: Math.round((grandTotal * p.percent) / 100),
  }));

  return (
    <Document title={`${docTitle} - ${data.reference}`}>
      {/* ---------------- PAGE 1 ---------------- */}
      <Page size="A4" style={styles.page}>
        <Header company={data.company} docTitle={docTitle} reference={data.reference} />

        <View style={styles.twoCol}>
          <View style={styles.colHalf}>
            <Text style={styles.sectionLabel}>PREPARED FOR</Text>
            <Text style={styles.clientName}>{data.clientName}</Text>
            {data.clientSubtitle ? (
              <Text style={styles.clientSubtitle}>{data.clientSubtitle}</Text>
            ) : null}
          </View>
          <View style={styles.colHalf}>
            <Text style={styles.sectionLabel}>{docTitle} DETAILS</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Date</Text>
              <Text style={styles.detailVal}>{data.date}</Text>
            </View>
            {data.validUntil ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Valid Until</Text>
                <Text style={styles.detailVal}>{data.validUntil}</Text>
              </View>
            ) : null}
            {data.preparedByLabel ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Prepared By</Text>
                <Text style={styles.detailVal}>{data.preparedByLabel}</Text>
              </View>
            ) : null}
            {data.projectType ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Project Type</Text>
                <Text style={styles.detailVal}>{data.projectType}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.overviewLabel}>PROJECT OVERVIEW</Text>
        <View style={styles.overviewBox}>
          <Text style={styles.overviewTitle}>{data.projectTitle}</Text>
          {data.projectSubtitle ? (
            <Text style={styles.overviewSubtitle}>{data.projectSubtitle}</Text>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValueSmall}>{data.zones ?? items.length}</Text>
            <Text style={styles.statLabel}>ZONE</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValueLarge}>Rs. {formatINR(subtotal)}</Text>
            <Text style={styles.statLabel}>SUBTOTAL</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValueSmall}>{data.validityLabel || "—"}</Text>
            <Text style={styles.statLabel}>VALIDITY</Text>
          </View>
        </View>

        <Text style={styles.overviewLabel}>DETAILED COST BREAKDOWN</Text>

        {/* Table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colNo]}>#</Text>
            <Text style={[styles.th, styles.colItem]}>ITEM</Text>
            <Text style={[styles.th, styles.colDesc, { color: "#FFFFFF" }]}>DESCRIPTION</Text>
            <Text style={[styles.th, styles.colQty]}>QTY</Text>
            <Text style={[styles.th, styles.colRate]}>RATE</Text>
            <Text style={[styles.th, styles.colAmt]}>AMOUNT</Text>
          </View>
          {items.map((it, idx) => {
            const amt = calcItemAmount(it);
            const qtyDisplay =
              it.unit && typeof it.quantity === "number"
                ? `${it.quantity} ${it.unit}`
                : String(it.quantity);
            return (
              <View
                key={`item-${idx}`}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowAlt : { backgroundColor: COLORS.creamSoft },
                ]}
              >
                <Text style={[styles.td, styles.colNo]}>{idx + 1}</Text>
                <Text style={[styles.tdBold, styles.colItem]}>{it.name}</Text>
                <Text style={[styles.td, styles.colDesc]}>{it.description || ""}</Text>
                <Text style={[styles.td, styles.colQty]}>{qtyDisplay}</Text>
                <Text style={[styles.td, styles.colRate]}>{formatINR(it.rate)}</Text>
                <Text style={[styles.tdBold, styles.colAmt]}>{formatINR(amt)}</Text>
              </View>
            );
          })}
          {extras.map((ex, idx) => (
            <View key={`extra-${idx}`} style={styles.installRow}>
              <Text style={[styles.tdBold, { flex: 1 }]}>{ex.label}</Text>
              <Text style={[styles.td, { width: 40, textAlign: "right" }]}>-</Text>
              <Text style={[styles.tdBold, styles.colAmt]}>{formatINR(ex.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalBox}>
          <View style={styles.totalLeft}>
            <Text style={styles.totalLabel}>TOTAL {docTitle}</Text>
            <Text style={styles.totalWords}>{rupeesInWords(grandTotal)}</Text>
          </View>
          <View style={styles.totalRight}>
            <View style={styles.totalLine}>
              <Text style={styles.totalKey}>Subtotal</Text>
              <Text style={styles.totalVal}>Rs. {formatINR(subtotal)}</Text>
            </View>
            {gstPercent > 0 ? (
              <View style={styles.totalLine}>
                <Text style={styles.totalKey}>GST ({gstPercent}%)</Text>
                <Text style={styles.totalVal}>Rs. {formatINR(gstAmount)}</Text>
              </View>
            ) : null}
            <Text style={styles.grandTotal}>Rs. {formatINR(grandTotal)}</Text>
          </View>
        </View>

        <PageFooter reference={data.reference} page={1} total={totalPages} />
      </Page>

      {/* ---------------- PAGE 2 ---------------- */}
      <Page size="A4" style={styles.page}>
        <Header company={data.company} docTitle={docTitle} reference={data.reference} />

        {schedule.length > 0 ? (
          <>
            <Text style={styles.payHeading}>Payment Schedule</Text>
            <View style={styles.payRow}>
              {schedule.map((p, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.payCard,
                    idx === schedule.length - 1 ? styles.payCardLast : {},
                  ]}
                >
                  <Text style={styles.payPercent}>{p.percent}%</Text>
                  <Text style={styles.payAmount}>Rs. {formatINR(p.amount)}</Text>
                  <Text style={styles.payNote}>{p.label}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.splitRow}>
          <View style={styles.splitCol}>
            <Text style={styles.payHeading}>What&apos;s Included</Text>
            {(data.whatsIncluded || []).map((line, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletDash}>-</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
          {data.maintenanceSupport ? (
            <View style={styles.splitCol}>
              <Text style={styles.payHeading}>Maintenance Support</Text>
              <Text style={styles.maintenanceDesc}>
                {data.maintenanceSupport.description}
              </Text>
              <Text style={styles.maintenanceCost}>
                {data.maintenanceSupport.cost}
              </Text>
            </View>
          ) : null}
        </View>

        {data.banking ? (
          <View style={styles.bankBox}>
            <View style={styles.bankLeft}>
              <Text style={styles.bankHeading}>Banking Details for Payment</Text>
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>Account Holder</Text>
                <Text style={styles.bankVal}>{data.banking.accountHolder}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>Bank</Text>
                <Text style={styles.bankVal}>{data.banking.bank}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>Account No.</Text>
                <Text style={styles.bankVal}>{data.banking.accountNo}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>IFSC Code</Text>
                <Text style={styles.bankVal}>{data.banking.ifsc}</Text>
              </View>
            </View>
            <View style={styles.bankRight}>
              <Text style={styles.qrLabel}>Scan and Pay</Text>
              <View style={styles.qrBox}>
                <Text style={styles.qrInner}>QR</Text>
              </View>
            </View>
          </View>
        ) : null}

        {data.termsAndConditions && data.termsAndConditions.length > 0 ? (
          <View>
            <Text style={styles.termsHeading}>Terms &amp; Conditions</Text>
            {data.termsAndConditions.map((line, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletDash}>-</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Bottom footer */}
        <View style={styles.bottomFooter} fixed>
          <View>
            {data.preparedBy ? (
              <>
                <Text style={styles.signerName}>{data.preparedBy.name}</Text>
                {data.preparedBy.title ? (
                  <Text style={styles.signerSub}>{data.preparedBy.title}</Text>
                ) : null}
                {data.preparedBy.phone || data.preparedBy.email ? (
                  <Text style={styles.signerContact}>
                    {[data.preparedBy.phone, data.preparedBy.email].filter(Boolean).join(" | ")}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>
          <View style={styles.companyRight}>
            <Text style={styles.companyRightName}>{data.company.name}</Text>
            {data.company.legalName ? (
              <Text style={styles.companyRightLegal}>
                {data.company.legalName}
                {data.company.city ? `, ${data.company.city}` : ""}
              </Text>
            ) : null}
            {data.company.website ? (
              <Text style={styles.companyRightSite}>{data.company.website}</Text>
            ) : null}
          </View>
        </View>

        <PageFooter reference={data.reference} page={2} total={totalPages} />
      </Page>
    </Document>
  );
}

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import type {
  Company,
  Project,
  ChangeOrder,
  COLineItem,
  COPhoto,
  ApprovalEvent,
} from "@/types";

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
  },
  companyInfo: {
    maxWidth: "60%",
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 1,
  },
  coNumberBlock: {
    alignItems: "flex-end",
  },
  coNumberLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  coNumber: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  // Info grid
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 100,
    fontSize: 9,
    color: "#6b7280",
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  // Description
  description: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
  },
  // Table
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 9,
  },
  colDescription: { flex: 3 },
  colQty: { width: 50, textAlign: "center" as const },
  colUnit: { width: 50, textAlign: "center" as const },
  colRate: { width: 70, textAlign: "right" as const },
  colAmount: { width: 80, textAlign: "right" as const },
  // Totals
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#1e40af",
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginRight: 24,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
  },
  // Photos
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoContainer: {
    width: 160,
    height: 120,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  // Approval record
  approvalBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  approvalTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
    marginBottom: 8,
  },
  approvalDetail: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 3,
  },
  declinedBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  declinedTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#991b1b",
    marginBottom: 8,
  },
  // Terms
  terms: {
    fontSize: 8,
    color: "#6b7280",
    lineHeight: 1.4,
    marginTop: 8,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    fontSize: 7,
    color: "#9ca3af",
  },
});

// ==========================================
// Status helpers
// ==========================================

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#f3f4f6", text: "#6b7280" },
  sent: { bg: "#dbeafe", text: "#1e40af" },
  approved: { bg: "#dcfce7", text: "#166534" },
  declined: { bg: "#fee2e2", text: "#991b1b" },
  void: { bg: "#f3f4f6", text: "#6b7280" },
  invoiced: { bg: "#f3e8ff", text: "#6b21a8" },
};

const statusLabels: Record<string, string> = {
  draft: "DRAFT",
  sent: "AWAITING APPROVAL",
  approved: "APPROVED",
  declined: "DECLINED",
  void: "VOID",
  invoiced: "INVOICED",
};

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// ==========================================
// PDF Document Component
// ==========================================

interface COPdfData {
  company: Company;
  project: Project;
  changeOrder: ChangeOrder;
  lineItems: COLineItem[];
  photos: COPhoto[];
  approvalEvents: ApprovalEvent[];
}

function CODocument({
  company,
  project,
  changeOrder,
  lineItems,
  photos,
  approvalEvents,
}: COPdfData) {
  const co = changeOrder;
  const total = Number(co.total_amount || co.fixed_amount || 0);
  const sColor = statusColors[co.status] || statusColors.draft;
  const approvalEvent = approvalEvents.find(
    (e) => e.action === "approved" || e.action === "declined"
  );
  const companyAddress = [
    company.address_street,
    company.address_city &&
      `${company.address_city}, ${company.address_state || ""} ${company.address_zip || ""}`.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          { style: styles.companyInfo },
          company.logo_url
            ? React.createElement(Image, {
                src: company.logo_url,
                style: { width: 120, height: 40, objectFit: "contain" as const, marginBottom: 4 },
              })
            : null,
          React.createElement(Text, { style: styles.companyName }, company.name),
          companyAddress
            ? React.createElement(Text, { style: styles.companyDetail }, companyAddress)
            : null,
          company.phone
            ? React.createElement(Text, { style: styles.companyDetail }, company.phone)
            : null
        ),
        React.createElement(
          View,
          { style: styles.coNumberBlock },
          React.createElement(Text, { style: styles.coNumberLabel }, "Change Order"),
          React.createElement(Text, { style: styles.coNumber }, co.co_number),
          React.createElement(
            Text,
            {
              style: {
                ...styles.statusBadge,
                backgroundColor: sColor.bg,
                color: sColor.text,
              },
            },
            statusLabels[co.status] || co.status.toUpperCase()
          )
        )
      ),

      // Project & CO Info
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Details"),
        React.createElement(
          View,
          { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, "Title:"),
          React.createElement(Text, { style: styles.infoValue }, co.title)
        ),
        React.createElement(
          View,
          { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, "Project:"),
          React.createElement(Text, { style: styles.infoValue }, project.name)
        ),
        project.client_name
          ? React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Client:"),
              React.createElement(Text, { style: styles.infoValue }, project.client_name)
            )
          : null,
        project.address
          ? React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Address:"),
              React.createElement(Text, { style: styles.infoValue }, project.address)
            )
          : null,
        React.createElement(
          View,
          { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, "Date Created:"),
          React.createElement(Text, { style: styles.infoValue }, formatDate(co.created_at))
        ),
        co.sent_at
          ? React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Date Sent:"),
              React.createElement(Text, { style: styles.infoValue }, formatDate(co.sent_at))
            )
          : null
      ),

      // Description
      co.description
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Description"),
            React.createElement(Text, { style: styles.description }, co.description)
          )
        : null,

      // Pricing
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Pricing"),
        co.pricing_type === "fixed" && co.fixed_amount
          ? React.createElement(
              View,
              { style: styles.infoRow },
              React.createElement(Text, { style: styles.infoLabel }, "Fixed Amount:"),
              React.createElement(
                Text,
                { style: styles.infoValue },
                formatCurrency(Number(co.fixed_amount))
              )
            )
          : null,
        lineItems.length > 0
          ? React.createElement(
              View,
              { style: styles.table },
              // Table header
              React.createElement(
                View,
                { style: styles.tableHeader },
                React.createElement(
                  Text,
                  { style: { ...styles.tableHeaderCell, ...styles.colDescription } },
                  "Description"
                ),
                React.createElement(
                  Text,
                  { style: { ...styles.tableHeaderCell, ...styles.colQty } },
                  "Qty"
                ),
                React.createElement(
                  Text,
                  { style: { ...styles.tableHeaderCell, ...styles.colUnit } },
                  "Unit"
                ),
                React.createElement(
                  Text,
                  { style: { ...styles.tableHeaderCell, ...styles.colRate } },
                  "Rate"
                ),
                React.createElement(
                  Text,
                  { style: { ...styles.tableHeaderCell, ...styles.colAmount } },
                  "Amount"
                )
              ),
              // Table rows
              ...lineItems.map((item) =>
                React.createElement(
                  View,
                  { key: item.id, style: styles.tableRow },
                  React.createElement(
                    Text,
                    { style: { ...styles.tableCell, ...styles.colDescription } },
                    item.description
                  ),
                  React.createElement(
                    Text,
                    { style: { ...styles.tableCell, ...styles.colQty } },
                    String(item.quantity)
                  ),
                  React.createElement(
                    Text,
                    { style: { ...styles.tableCell, ...styles.colUnit } },
                    item.unit
                  ),
                  React.createElement(
                    Text,
                    { style: { ...styles.tableCell, ...styles.colRate } },
                    item.rate ? formatCurrency(Number(item.rate)) : "-"
                  ),
                  React.createElement(
                    Text,
                    { style: { ...styles.tableCell, ...styles.colAmount } },
                    item.amount ? formatCurrency(Number(item.amount)) : "-"
                  )
                )
              )
            )
          : null,
        // Total
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Total:"),
          React.createElement(Text, { style: styles.totalValue }, formatCurrency(total))
        )
      ),

      // Photos
      photos.length > 0
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              `Photos (${photos.length})`
            ),
            React.createElement(
              View,
              { style: styles.photoGrid },
              ...photos.map((photo) =>
                React.createElement(
                  View,
                  { key: photo.id, style: styles.photoContainer },
                  React.createElement(Image, {
                    src: photo.annotated_url || photo.original_url,
                    style: styles.photo,
                  })
                )
              )
            )
          )
        : null,

      // Approval record
      approvalEvent && approvalEvent.action === "approved"
        ? React.createElement(
            View,
            { style: styles.approvalBox },
            React.createElement(Text, { style: styles.approvalTitle }, "Approval Record"),
            React.createElement(
              Text,
              { style: styles.approvalDetail },
              `Status: Approved`
            ),
            React.createElement(
              Text,
              { style: styles.approvalDetail },
              `Date: ${formatDateTime(approvalEvent.created_at)}`
            ),
            React.createElement(
              Text,
              { style: styles.approvalDetail },
              `Method: ${approvalEvent.method || "link"}`
            ),
            approvalEvent.client_name_typed
              ? React.createElement(
                  Text,
                  { style: styles.approvalDetail },
                  `Signed by: ${approvalEvent.client_name_typed}`
                )
              : null,
            approvalEvent.ip_address
              ? React.createElement(
                  Text,
                  { style: { ...styles.approvalDetail, fontSize: 7, color: "#6b7280" } },
                  `IP: ${approvalEvent.ip_address}`
                )
              : null
          )
        : null,
      approvalEvent && approvalEvent.action === "declined"
        ? React.createElement(
            View,
            { style: styles.declinedBox },
            React.createElement(Text, { style: styles.declinedTitle }, "Declined"),
            React.createElement(
              Text,
              { style: styles.approvalDetail },
              `Date: ${formatDateTime(approvalEvent.created_at)}`
            ),
            React.createElement(
              Text,
              { style: styles.approvalDetail },
              `Method: ${approvalEvent.method || "link"}`
            )
          )
        : null,

      // Terms
      company.settings?.terms_text
        ? React.createElement(
            View,
            { style: { ...styles.section, marginTop: 16 } },
            React.createElement(Text, { style: styles.sectionTitle }, "Terms & Conditions"),
            React.createElement(Text, { style: styles.terms }, company.settings.terms_text)
          )
        : null,

      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          Text,
          null,
          `${co.co_number} — ${company.name}`
        ),
        React.createElement(
          Text,
          null,
          `Generated ${new Date().toLocaleDateString("en-US")}`
        )
      )
    )
  );
}

// ==========================================
// Public API
// ==========================================

export async function generateCOPdf(data: COPdfData): Promise<Buffer> {
  const doc = CODocument(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any);
  return Buffer.from(buffer);
}

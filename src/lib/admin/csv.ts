import Papa from "papaparse";
import type { CompanyStats } from "./types";

const CSV_COLUMNS = [
  { key: "company_name", label: "Company Name" },
  { key: "owner_name", label: "Owner Name" },
  { key: "owner_email", label: "Owner Email" },
  { key: "plan_name", label: "Plan" },
  { key: "subscription_status", label: "Status" },
  { key: "total_change_orders", label: "# COs" },
  { key: "last_activity_at", label: "Last Activity" },
  { key: "channel_preference", label: "Channel" },
  { key: "signup_at", label: "Signup Date" },
] as const;

export function companyStatsToCsvRow(
  row: CompanyStats
): Record<string, string | number | null> {
  return Object.fromEntries(
    CSV_COLUMNS.map((col) => [
      col.label,
      row[col.key as keyof CompanyStats] ?? "",
    ])
  );
}

export function generateCsvString(rows: CompanyStats[]): string {
  const mapped = rows.map(companyStatsToCsvRow);
  return Papa.unparse(mapped);
}

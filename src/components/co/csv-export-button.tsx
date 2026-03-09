"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ChangeOrderRow {
  co_number: string;
  title: string;
  status: string;
  pricing_type: string;
  fixed_amount: number | null;
  total_amount: number | null;
  sent_at: string | null;
  approved_at: string | null;
  created_at: string;
}

interface CsvExportButtonProps {
  changeOrders: ChangeOrderRow[];
  projectName: string;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function CsvExportButton({
  changeOrders,
  projectName,
}: CsvExportButtonProps) {
  function handleExport() {
    const headers = [
      "CO #",
      "Title",
      "Status",
      "Pricing Type",
      "Amount",
      "Date Created",
      "Date Sent",
      "Date Approved",
    ];

    const rows = changeOrders.map((co) => [
      escapeCSV(co.co_number),
      escapeCSV(co.title),
      escapeCSV(co.status),
      escapeCSV(co.pricing_type),
      String(Number(co.total_amount || co.fixed_amount || 0)),
      co.created_at ? new Date(co.created_at).toLocaleDateString() : "",
      co.sent_at ? new Date(co.sent_at).toLocaleDateString() : "",
      co.approved_at ? new Date(co.approved_at).toLocaleDateString() : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/[^a-zA-Z0-9]/g, "_")}_change_orders.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!changeOrders.length) return null;

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-1.5 h-3.5 w-3.5" />
      Export CSV
    </Button>
  );
}

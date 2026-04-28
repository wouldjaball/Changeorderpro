"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateCsvString } from "@/lib/admin/csv";
import type { CompanyStats } from "@/lib/admin/types";

interface CsvExportButtonProps {
  data: CompanyStats[];
}

export function CsvExportButton({ data }: CsvExportButtonProps) {
  function handleExport() {
    const csv = generateCsvString(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `companies-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download size={14} />
      Export CSV
    </Button>
  );
}

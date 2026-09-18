import type { DashboardFilters } from "@/lib/dashboard/filters";

export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    stats: (companyId: string) => ["dashboard", "stats", companyId] as const,
    list: (companyId: string, filters: DashboardFilters) =>
      ["dashboard", "list", companyId, filters] as const,
  },
  co: {
    prepareSend: (changeOrderId: string) =>
      ["co", "prepare-send", changeOrderId] as const,
  },
};

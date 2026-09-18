export interface DashboardFilters {
  status: string;
  project: string;
  q: string;
  period: string;
}

export const EMPTY_DASHBOARD_FILTERS: DashboardFilters = {
  status: "",
  project: "",
  q: "",
  period: "",
};

function firstValue(value: string | string[] | undefined | null): string {
  if (Array.isArray(value)) return (value[0] || "").trim();
  return (value || "").trim();
}

function normalize(value: string): string {
  return value === "all" ? "" : value;
}

export function parseDashboardFilters(
  input: Record<string, string | string[] | undefined> | URLSearchParams
): DashboardFilters {
  const read = (key: string) =>
    input instanceof URLSearchParams
      ? firstValue(input.get(key))
      : firstValue(input[key]);

  const status = normalize(read("status"));
  const project = normalize(read("project"));
  const q = read("q");
  const period = status === "approved" ? normalize(read("period")) : "";

  return { status, project, q, period };
}

export function hasActiveFilters(filters: DashboardFilters): boolean {
  return Boolean(
    filters.status || filters.project || filters.q || filters.period
  );
}

export function dashboardFiltersToSearchParams(
  filters: DashboardFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.project) params.set("project", filters.project);
  if (filters.q) params.set("q", filters.q);
  if (filters.period) params.set("period", filters.period);
  return params;
}

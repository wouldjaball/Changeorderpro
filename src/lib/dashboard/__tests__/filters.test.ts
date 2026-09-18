import { describe, it, expect } from "vitest";
import {
  hasActiveFilters,
  parseDashboardFilters,
  dashboardFiltersToSearchParams,
} from "../filters";

describe("parseDashboardFilters", () => {
  it("returns empty strings when nothing is set", () => {
    expect(parseDashboardFilters({})).toEqual({
      status: "",
      project: "",
      q: "",
      period: "",
    });
  });

  it("reads values from a plain search params object", () => {
    expect(
      parseDashboardFilters({
        status: "approved",
        project: "project-1",
        q: "deck",
        period: "month",
      })
    ).toEqual({
      status: "approved",
      project: "project-1",
      q: "deck",
      period: "month",
    });
  });

  it("reads values from URLSearchParams", () => {
    const params = new URLSearchParams(
      "status=approved&project=project-1&q=deck&period=month"
    );
    expect(parseDashboardFilters(params)).toEqual({
      status: "approved",
      project: "project-1",
      q: "deck",
      period: "month",
    });
  });

  it("treats 'all' as unset for status, project and period", () => {
    expect(
      parseDashboardFilters({ status: "all", project: "all", period: "all" })
    ).toEqual({ status: "", project: "", q: "", period: "" });
  });

  it("drops period when status is not approved", () => {
    expect(parseDashboardFilters({ status: "sent", period: "month" })).toEqual({
      status: "sent",
      project: "",
      q: "",
      period: "",
    });
    expect(
      parseDashboardFilters(new URLSearchParams("period=month"))
    ).toEqual({ status: "", project: "", q: "", period: "" });
  });

  it("keeps period when status is approved", () => {
    expect(
      parseDashboardFilters({ status: "approved", period: "month" }).period
    ).toBe("month");
  });

  it("takes the first value of a repeated param and trims whitespace", () => {
    expect(parseDashboardFilters({ status: ["sent", "paid"] }).status).toBe(
      "sent"
    );
    expect(parseDashboardFilters({ q: "  deck  " }).q).toBe("deck");
  });
});

describe("hasActiveFilters", () => {
  it("is false when every filter is empty", () => {
    expect(
      hasActiveFilters({ status: "", project: "", q: "", period: "" })
    ).toBe(false);
  });

  it("is true when any single filter is set", () => {
    expect(
      hasActiveFilters({ status: "sent", project: "", q: "", period: "" })
    ).toBe(true);
    expect(
      hasActiveFilters({ status: "", project: "p1", q: "", period: "" })
    ).toBe(true);
    expect(
      hasActiveFilters({ status: "", project: "", q: "deck", period: "" })
    ).toBe(true);
    expect(
      hasActiveFilters({ status: "", project: "", q: "", period: "month" })
    ).toBe(true);
  });
});

describe("dashboardFiltersToSearchParams", () => {
  it("omits empty filters", () => {
    expect(
      dashboardFiltersToSearchParams({
        status: "approved",
        project: "",
        q: "",
        period: "month",
      }).toString()
    ).toBe("status=approved&period=month");
  });
});

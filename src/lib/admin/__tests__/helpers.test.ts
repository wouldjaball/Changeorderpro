import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatRelativeTime,
  formatAbsoluteDate,
  calculateDelta,
} from "../helpers";

describe("formatCurrency", () => {
  it("formats positive amounts", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("returns dash for null", () => {
    expect(formatCurrency(null)).toBe("—");
  });
});

describe("formatRelativeTime", () => {
  it("returns Never for null", () => {
    expect(formatRelativeTime(null)).toBe("Never");
  });

  it("returns Just now for recent dates", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("Just now");
  });

  it("returns hours ago for dates within a day", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days ago for dates within a week", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
  });
});

describe("formatAbsoluteDate", () => {
  it("returns dash for null", () => {
    expect(formatAbsoluteDate(null)).toBe("—");
  });

  it("formats a valid date", () => {
    const result = formatAbsoluteDate("2026-01-15T12:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("2026");
  });
});

describe("calculateDelta", () => {
  it("returns up for positive change", () => {
    const result = calculateDelta(120, 100);
    expect(result.direction).toBe("up");
    expect(result.percentage).toBe(20);
  });

  it("returns down for negative change", () => {
    const result = calculateDelta(80, 100);
    expect(result.direction).toBe("down");
    expect(result.percentage).toBe(20);
  });

  it("returns flat for no change", () => {
    const result = calculateDelta(100, 100);
    expect(result.direction).toBe("flat");
    expect(result.percentage).toBe(0);
  });

  it("returns flat when previous is zero", () => {
    const result = calculateDelta(50, 0);
    expect(result.direction).toBe("flat");
    expect(result.percentage).toBe(0);
  });
});

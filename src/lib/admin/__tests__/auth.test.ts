import { describe, it, expect, vi, beforeEach } from "vitest";

describe("isAdminEmail", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns true for allowlisted email", async () => {
    vi.stubEnv("ADMIN_ALLOWLIST", "boss@salesmonsters.com,evan@salesmonsters.com");
    const { isAdminEmail } = await import("../auth");
    expect(isAdminEmail("boss@salesmonsters.com")).toBe(true);
  });

  it("is case-insensitive", async () => {
    vi.stubEnv("ADMIN_ALLOWLIST", "boss@salesmonsters.com");
    const { isAdminEmail } = await import("../auth");
    expect(isAdminEmail("BOSS@salesmonsters.com")).toBe(true);
    expect(isAdminEmail("Boss@SalesMonsters.com")).toBe(true);
  });

  it("returns false for non-allowlisted email", async () => {
    vi.stubEnv("ADMIN_ALLOWLIST", "boss@salesmonsters.com");
    const { isAdminEmail } = await import("../auth");
    expect(isAdminEmail("hacker@evil.com")).toBe(false);
  });

  it("returns false when allowlist is empty", async () => {
    vi.stubEnv("ADMIN_ALLOWLIST", "");
    const { isAdminEmail } = await import("../auth");
    expect(isAdminEmail("anyone@example.com")).toBe(false);
  });

  it("handles whitespace in allowlist", async () => {
    vi.stubEnv("ADMIN_ALLOWLIST", " boss@salesmonsters.com , evan@salesmonsters.com ");
    const { isAdminEmail } = await import("../auth");
    expect(isAdminEmail("boss@salesmonsters.com")).toBe(true);
    expect(isAdminEmail("evan@salesmonsters.com")).toBe(true);
  });

  it("returns correct allowlist from getter", async () => {
    vi.stubEnv("ADMIN_ALLOWLIST", "boss@salesmonsters.com,evan@salesmonsters.com");
    const { getAdminAllowlist } = await import("../auth");
    expect(getAdminAllowlist()).toEqual([
      "boss@salesmonsters.com",
      "evan@salesmonsters.com",
    ]);
  });
});

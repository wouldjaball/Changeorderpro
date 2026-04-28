const ADMIN_ALLOWLIST = (process.env.ADMIN_ALLOWLIST || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_ALLOWLIST.includes(email.toLowerCase());
}

export function getAdminAllowlist(): string[] {
  return [...ADMIN_ALLOWLIST];
}

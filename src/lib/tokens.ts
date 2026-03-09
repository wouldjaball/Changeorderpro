import { createHmac, randomUUID } from "crypto";

const TOKEN_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
const TOKEN_EXPIRY_HOURS = 72;

/**
 * Generate a cryptographically signed approval token.
 * Returns { token, expiresAt } to store on the CO record.
 */
export function generateApprovalToken(): {
  token: string;
  expiresAt: Date;
} {
  const id = randomUUID();
  const signature = createHmac("sha256", TOKEN_SECRET)
    .update(id)
    .digest("hex")
    .slice(0, 12);

  const token = `${id}-${signature}`;
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  );

  return { token, expiresAt };
}

/**
 * Validate an approval token's signature.
 * Returns the UUID portion if valid, null if invalid.
 */
export function validateTokenSignature(token: string): string | null {
  const parts = token.split("-");
  // UUID has 5 parts, signature is the 6th
  if (parts.length !== 6) return null;

  const id = parts.slice(0, 5).join("-");
  const providedSig = parts[5];

  const expectedSig = createHmac("sha256", TOKEN_SECRET)
    .update(id)
    .digest("hex")
    .slice(0, 12);

  if (providedSig !== expectedSig) return null;
  return id;
}

/**
 * Full token validation: signature + expiry + single-use check.
 * Call this from the approval page and webhook handlers.
 */
export function isTokenValid(
  token: string,
  expiresAt: string | null,
  coStatus: string
): { valid: boolean; reason?: string } {
  // Check signature
  if (!validateTokenSignature(token)) {
    return { valid: false, reason: "Invalid token" };
  }

  // Check expiry
  if (!expiresAt || new Date(expiresAt) < new Date()) {
    return { valid: false, reason: "Token has expired" };
  }

  // Check if already used (CO is no longer in 'sent' status)
  if (coStatus !== "sent") {
    return {
      valid: false,
      reason:
        coStatus === "approved"
          ? "This change order has already been approved"
          : coStatus === "declined"
            ? "This change order has already been declined"
            : "This change order is no longer awaiting approval",
    };
  }

  return { valid: true };
}

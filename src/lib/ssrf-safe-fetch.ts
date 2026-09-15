import dns from "node:dns/promises";
import net from "node:net";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 5000;

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.split(":").pop()!;
    if (net.isIPv4(v4)) return isPrivateIPv4(v4);
  }
  return false;
}

function isPrivateIP(ip: string): boolean {
  return net.isIPv6(ip) ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (hostname === "localhost") {
    throw new Error("Blocked host");
  }
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) {
    throw new Error("Could not resolve host");
  }
  for (const { address } of addresses) {
    if (isPrivateIP(address)) {
      throw new Error("Blocked host: resolves to a private address");
    }
  }
}

/**
 * Fetches a URL that a user typed in, blocking requests that resolve to
 * private/internal IP ranges (loopback, RFC1918, link-local/cloud metadata).
 * Re-validates on every redirect hop. Does not defend against DNS rebinding
 * between the lookup here and Node's own connect-time resolution — acceptable
 * for this low-value internal use case, but not a substitute for network-level
 * egress controls if this pattern is reused somewhere higher stakes.
 */
export async function ssrfSafeFetch(
  url: string,
  init?: { accept?: string }
): Promise<Response> {
  let current = new URL(url);

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    if (current.protocol !== "http:" && current.protocol !== "https:") {
      throw new Error("Only http/https URLs are allowed");
    }
    await assertPublicHost(current.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: init?.accept ? { Accept: init.accept } : undefined,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect with no location");
      current = new URL(location, current);
      continue;
    }

    return res;
  }

  throw new Error("Too many redirects");
}

export async function readBodyCapped(
  res: Response,
  maxBytes: number
): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) return Buffer.from(await res.arrayBuffer());

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("Response too large");
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

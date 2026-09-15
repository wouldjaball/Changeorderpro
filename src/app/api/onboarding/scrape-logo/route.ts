import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ssrfSafeFetch, readBodyCapped } from "@/lib/ssrf-safe-fetch";

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function resolveUrl(candidate: string, base: string): string | null {
  try {
    return new URL(candidate, base).toString();
  } catch {
    return null;
  }
}

function findLogoCandidate($: cheerio.CheerioAPI, pageUrl: string): string | null {
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    const resolved = resolveUrl(ogImage, pageUrl);
    if (resolved) return resolved;
  }

  const appleTouchIcon = $(
    'link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]'
  ).attr("href");
  if (appleTouchIcon) {
    const resolved = resolveUrl(appleTouchIcon, pageUrl);
    if (resolved) return resolved;
  }

  let logoImgSrc: string | undefined;
  $("img").each((_, el) => {
    if (logoImgSrc) return;
    const attrs = [$(el).attr("class"), $(el).attr("id"), $(el).attr("alt")]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (attrs.includes("logo")) {
      logoImgSrc = $(el).attr("src");
    }
  });
  if (logoImgSrc) {
    const resolved = resolveUrl(logoImgSrc, pageUrl);
    if (resolved) return resolved;
  }

  const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr("href");
  if (favicon) {
    const resolved = resolveUrl(favicon, pageUrl);
    if (resolved) return resolved;
  }

  return null;
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const website = typeof body?.website === "string" ? body.website.trim() : "";
  const companyId = typeof body?.companyId === "string" ? body.companyId : "";

  if (!website || !companyId) {
    return NextResponse.json(
      { error: "Missing website or companyId" },
      { status: 400 }
    );
  }

  const pageUrl = /^https?:\/\//i.test(website) ? website : `https://${website}`;

  try {
    const pageRes = await ssrfSafeFetch(pageUrl, { accept: "text/html" });
    if (!pageRes.ok) {
      return NextResponse.json({ logoUrl: null });
    }
    const contentType = pageRes.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ logoUrl: null });
    }

    const htmlBuffer = await readBodyCapped(pageRes, MAX_HTML_BYTES);
    const $ = cheerio.load(htmlBuffer.toString("utf-8"));
    const candidate = findLogoCandidate($, pageRes.url || pageUrl);

    if (!candidate) {
      return NextResponse.json({ logoUrl: null });
    }

    const imageRes = await ssrfSafeFetch(candidate, { accept: "image/*" });
    if (!imageRes.ok) {
      return NextResponse.json({ logoUrl: null });
    }
    const imageContentType = imageRes.headers.get("content-type") || "";
    if (!imageContentType.startsWith("image/")) {
      return NextResponse.json({ logoUrl: null });
    }

    const imageBuffer = await readBodyCapped(imageRes, MAX_IMAGE_BYTES);
    const ext = extensionForContentType(imageContentType);

    const admin = createAdminClient();
    const path = `${companyId}/logo.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("company-logos")
      .upload(path, imageBuffer, { upsert: true, contentType: imageContentType });

    if (uploadError) {
      return NextResponse.json({ logoUrl: null });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("company-logos").getPublicUrl(path);

    return NextResponse.json({ logoUrl: publicUrl });
  } catch {
    return NextResponse.json({ logoUrl: null });
  }
}

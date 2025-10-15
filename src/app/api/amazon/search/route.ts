// src/app/api/amazon/search/route.ts
import { NextResponse } from "next/server";

/**
 * Amazon redirect API — stable, minimal, and language-aware.
 *
 * Accepts:
 *   GET  /api/amazon/search?q=...&lang=en|pt|es|fr&redirect=1
 *   POST /api/amazon/search  { q?: string, lang?: string, redirect?: "1" }
 *
 * Behavior:
 *   - Maps lang -> Amazon TLD (en→.com, pt→.com.br, es→.es, fr→.fr).
 *   - Appends your Associates tag "mateussousa-20".
 *   - If redirect=1, issues a 302 to the built Amazon URL.
 *   - Otherwise returns { url } as JSON.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PARTNER_TAG = "mateussousa-20" as const;

/** Map the app's language to the Amazon domain you asked for. */
function domainForLang(lang: string | null | undefined): string {
  switch ((lang || "en").toLowerCase()) {
    case "pt":
      return "www.amazon.com.br";
    case "es":
      return "www.amazon.es";
    case "fr":
      return "www.amazon.fr";
    case "en":
    default:
      return "www.amazon.com";
  }
}

/** Build the Amazon search URL with your tag. */
function buildAmazonSearchUrl(q: string, lang: string | null | undefined): string {
  const host = domainForLang(lang);
  const url = new URL(`https://${host}/s`);
  url.searchParams.set("k", q);
  url.searchParams.set("tag", PARTNER_TAG);
  return url.toString();
}

/** Shared handler logic for GET/POST. */
async function handle(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  let q = (searchParams.get("q") || "").trim();
  let lang = searchParams.get("lang");
  let redirect = searchParams.get("redirect");

  // If it's a POST, allow JSON body to supply/override values.
  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({} as any));
      if (typeof body?.q === "string") q = body.q.trim() || q;
      if (typeof body?.lang === "string") lang = body.lang || lang;
      if (typeof body?.redirect === "string") redirect = body.redirect || redirect;
    } catch {
      // ignore bad JSON; we'll fall back to query params
    }
  }

  if (!q) {
    return NextResponse.json({ error: "Missing q (search keywords)" }, { status: 400 });
  }

  const url = buildAmazonSearchUrl(q, lang);

  if (redirect === "1") {
    // 302 redirect to Amazon
    return NextResponse.redirect(url, { status: 302 });
  }

  // Return URL for clients that want to inspect/use it themselves
  return NextResponse.json({ url }, { status: 200 });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { importRecipeFromHtml } from "@/lib/recipe-import";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_HTML_LENGTH = 2_000_000;

function isPrivateOrLocalHostname(hostname: string) {
  const value = hostname.toLowerCase();

  if (value === "localhost" || value.endsWith(".local")) {
    return true;
  }

  if (value === "::1") {
    return true;
  }

  if (/^127\./.test(value) || /^10\./.test(value) || /^192\.168\./.test(value)) {
    return true;
  }

  const private172 = value.match(/^172\.(\d{1,3})\./);
  if (private172) {
    const block = Number(private172[1]);
    if (block >= 16 && block <= 31) {
      return true;
    }
  }

  return false;
}

function parseImportUrl(rawUrl: unknown) {
  if (typeof rawUrl !== "string") {
    throw new Error("URL must be a string.");
  }

  const url = new URL(rawUrl.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported.");
  }

  if (isPrivateOrLocalHostname(url.hostname)) {
    throw new Error("Private and local network URLs are not allowed.");
  }

  return url;
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const url = parseImportUrl(body?.url);

    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "user-agent": "RecipeRankerBot/1.0 (+https://recipe-ranker.local)",
        accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Unable to fetch URL (status ${response.status}).` }, { status: 400 });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return NextResponse.json({ error: "URL did not return an HTML page." }, { status: 400 });
    }

    const html = await response.text();
    if (html.length > MAX_HTML_LENGTH) {
      return NextResponse.json({ error: "Page is too large to import." }, { status: 413 });
    }

    const result = importRecipeFromHtml(html, url.toString());

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to import recipe from URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

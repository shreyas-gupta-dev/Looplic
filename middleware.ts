import { NextResponse, type NextRequest } from "next/server";

const OAUTH_REDIRECT_COOKIE = "looplic-auth-redirect";
const CANONICAL_HOST = "www.looplic.com";
const APEX_HOST = "looplic.com";

function sanitizeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/")) {
    return "/";
  }

  return value;
}

function decodeRedirectCookie(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isLooplicHost(host: string) {
  return host === APEX_HOST || host === CANONICAL_HOST;
}

function isLocalHost(host: string) {
  const hostname = host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const host = request.headers.get("host")?.toLowerCase();
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const code = nextUrl.searchParams.get("code");

  // Only looplic.com may serve the site. Any other host (the *.amplifyapp.com
  // default domain, Amplify preview URLs, raw CloudFront, etc.) redirects to the
  // canonical domain so it is never "the website" on its own.
  if (host && !isLooplicHost(host) && !isLocalHost(host)) {
    const canonicalUrl = nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.host = CANONICAL_HOST;

    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (host === APEX_HOST || (host === CANONICAL_HOST && forwardedProto === "http")) {
    const canonicalUrl = nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.host = CANONICAL_HOST;

    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (nextUrl.pathname === "/" && code) {
    const callbackUrl = new URL("/auth/callback", nextUrl.origin);
    callbackUrl.searchParams.set("code", code);

    const storedRedirect = request.cookies.get(OAUTH_REDIRECT_COOKIE)?.value;
    const next = nextUrl.searchParams.get("next") || (storedRedirect ? sanitizeRedirect(decodeRedirectCookie(storedRedirect)) : null);
    const state = nextUrl.searchParams.get("state");

    if (next) {
      callbackUrl.searchParams.set("next", next);
    }

    if (state) {
      callbackUrl.searchParams.set("state", state);
    }

    return NextResponse.redirect(callbackUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

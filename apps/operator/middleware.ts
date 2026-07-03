import { NextResponse, type NextRequest } from "next/server";

// This deployment serves ONLY the operator console at operator.looplic.com. Any
// other host (the *.amplifyapp.com default domain, Amplify preview URLs, raw
// CloudFront, etc.) is redirected to the canonical operator subdomain so it is
// never "the operator site" on its own.
const CANONICAL_HOST = "operator.looplic.com";

function isLocalHost(host: string) {
  const hostname = host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const host = request.headers.get("host")?.toLowerCase();
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (host && !isLocalHost(host) && (host !== CANONICAL_HOST || forwardedProto === "http")) {
    const canonicalUrl = nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.host = CANONICAL_HOST;
    canonicalUrl.port = "";

    return NextResponse.redirect(canonicalUrl, 308);
  }

  // Only the operator console (and the API routes it depends on) is served here.
  // Any stray path is bounced to the operator login. Root-level static assets
  // (manifest.webmanifest, sw.js, app icons, etc.) live at "/" with a file
  // extension and must be served as-is. (_next/static and favicon.ico are
  // already excluded by the matcher below.)
  const path = nextUrl.pathname;
  const isOperatorPath = path === "/operator" || path.startsWith("/operator/");
  const isApi = path.startsWith("/api/");
  const isAsset = path.includes(".");
  if (path !== "/" && !isOperatorPath && !isApi && !isAsset) {
    const target = nextUrl.clone();
    target.pathname = "/operator/login";
    target.search = "";
    return NextResponse.redirect(target, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

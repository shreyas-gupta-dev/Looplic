import { NextResponse, type NextRequest } from "next/server";

// This deployment serves ONLY the technician back-office at tech.looplic.com.
// Any other host (the *.amplifyapp.com default domain, Amplify preview URLs,
// raw CloudFront, etc.) is redirected to the canonical technician subdomain so
// it is never "the technician site" on its own.
const CANONICAL_HOST = "tech.looplic.com";

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

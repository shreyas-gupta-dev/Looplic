import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// The same Next app is deployed to two Amplify apps behind two canonical hosts:
//   - admin.looplic.com    — the full admin/operator back-office
//   - operator.looplic.com — the operator console ONLY
// Both build from this one codebase; they are distinguished purely by the
// incoming Host header. Any other host (the *.amplifyapp.com default domains,
// Amplify preview URLs, raw CloudFront, etc.) is redirected to the admin host
// so a raw deployment URL is never "the site" on its own.
const ADMIN_HOST = "admin.looplic.com";
const OPERATOR_HOST = "operator.looplic.com";
const CANONICAL_HOSTS = new Set([ADMIN_HOST, OPERATOR_HOST]);

function isLocalHost(host: string) {
  const hostname = host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const host = request.headers.get("host")?.toLowerCase();
  const hostname = host?.split(":")[0];
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (host && !isLocalHost(host)) {
    const isCanonical = hostname ? CANONICAL_HOSTS.has(hostname) : false;

    // Force HTTPS on the canonical hosts, and send any non-canonical host to the
    // admin host. Canonical hosts are preserved (admin stays admin, operator
    // stays operator).
    if (!isCanonical || forwardedProto === "http") {
      const target = nextUrl.clone();
      target.protocol = "https:";
      target.host = isCanonical ? hostname! : ADMIN_HOST;
      target.port = "";
      return NextResponse.redirect(target, 308);
    }

    // On the operator subdomain, only the operator console (and the API routes
    // it depends on) is served. Everything else — the admin dashboard, customer
    // pages, etc. — is bounced to the operator login. This is defense in depth;
    // access is still role-gated regardless of host. Note: admin.looplic.com
    // keeps serving /operator too, so both URLs work.
    if (hostname === OPERATOR_HOST) {
      const path = nextUrl.pathname;
      const isOperatorPath = path === "/operator" || path.startsWith("/operator/");
      const isApi = path.startsWith("/api/");
      // Root-level static assets the layout depends on (manifest.webmanifest,
      // sw.js, app icons, etc.) aren't app routes — they live at "/" with a file
      // extension and must be served as-is. Without this they'd 307 to the login
      // page, breaking the PWA manifest, icons, and service-worker registration
      // on the operator host. (_next/static and favicon.ico are already excluded
      // by the matcher below.)
      const isAsset = path.includes(".");
      if (!isOperatorPath && !isApi && !isAsset) {
        const target = nextUrl.clone();
        target.pathname = "/operator/login";
        target.search = "";
        return NextResponse.redirect(target, 307);
      }
    }
  }

  // Refresh the Supabase auth session on every request. This ensures the
  // server-side session (used by db-proxy to authorize requests) stays valid
  // even after the JWT expires. Without this, the db-proxy route returns
  // "Unauthorized" because cookies contain an expired token.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // This call refreshes the session if the access token is expired and writes
  // fresh cookies via setAll above.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

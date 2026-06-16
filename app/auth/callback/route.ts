import { NextResponse } from "next/server";
import { getServerSupabase } from "@/src/lib/supabase/server";
import { OAUTH_REDIRECT_COOKIE, sanitizeRedirect } from "@/src/lib/auth-redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const cookieHeader = request.headers.get("cookie") ?? "";

  const fallbackRedirect =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${OAUTH_REDIRECT_COOKIE}=`))
      ?.slice(OAUTH_REDIRECT_COOKIE.length + 1) ?? null;

  const safeNext = sanitizeRedirect(
    next || (fallbackRedirect ? decodeURIComponent(fallbackRedirect) : null),
  );

  // Exchange the OAuth/PKCE code for a session. getServerSupabase writes the
  // session cookies via the cookie adapter, so the redirect response carries them.
  if (code) {
    const supabase = await getServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const response = NextResponse.redirect(new URL(safeNext || "/", requestUrl.origin));
  response.cookies.set(OAUTH_REDIRECT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

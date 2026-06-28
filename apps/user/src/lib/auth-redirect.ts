type OAuthRedirectState = {
  redirectTo?: string;
};

export const OAUTH_REDIRECT_COOKIE = "looplic-auth-redirect";

export function sanitizeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/")) {
    return "/";
  }

  return value;
}

function toBase64Url(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  const encoded = new TextEncoder().encode(value);
  let binary = "";

  encoded.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "base64url").toString("utf8");
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeOAuthRedirectState(redirectTo: string) {
  return toBase64Url(
    JSON.stringify({
      redirectTo: sanitizeRedirect(redirectTo),
    } satisfies OAuthRedirectState),
  );
}

export function parseOAuthRedirectState(value: string | null | undefined): OAuthRedirectState | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = fromBase64Url(value);
    const parsed = JSON.parse(decoded) as OAuthRedirectState;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      redirectTo: typeof parsed.redirectTo === "string" ? sanitizeRedirect(parsed.redirectTo) : undefined,
    };
  } catch {
    return null;
  }
}

"use client";

import {
  confirmSignIn,
  fetchAuthSession,
  signIn,
  signInWithRedirect,
  signOut,
  signUp,
  type AuthUser,
} from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import { amplifyConfig, hasCognitoConfig } from "./config";

let configured = false;

function ensureConfigured() {
  if (!configured && hasCognitoConfig) {
    Amplify.configure(amplifyConfig, { ssr: true });
    configured = true;
  }
}

export type CognitoUser = {
  id: string;
  email: string | undefined;
  name: string | undefined;
};

function mapUser(user: AuthUser, attributes?: Record<string, string>): CognitoUser {
  return {
    id: user.userId,
    email: attributes?.email,
    name: attributes?.name,
  };
}

export async function getClientSession(): Promise<{ user: CognitoUser | null }> {
  ensureConfigured();
  try {
    const { tokens } = await fetchAuthSession();
    if (!tokens?.idToken) return { user: null };

    const payload = tokens.idToken.payload;
    return {
      user: {
        id: String(payload.sub || ""),
        email: String(payload.email || ""),
        name: String(payload.name || payload["cognito:username"] || ""),
      },
    };
  } catch {
    return { user: null };
  }
}

export async function signInWithEmail(email: string, password: string) {
  ensureConfigured();
  const result = await signIn({ username: email.trim().toLowerCase(), password: password.trim() });
  return result;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  ensureConfigured();
  const result = await signUp({
    username: email.trim().toLowerCase(),
    password,
    options: {
      userAttributes: {
        email: email.trim().toLowerCase(),
        name,
      },
    },
  });
  return result;
}

export async function signInWithGoogle(redirectUrl?: string) {
  ensureConfigured();
  await signInWithRedirect({
    provider: "Google",
    customState: redirectUrl ? JSON.stringify({ redirectTo: redirectUrl }) : undefined,
  });
}

export async function signOutClient() {
  ensureConfigured();
  await signOut();
}

export async function getIdToken(): Promise<string | null> {
  ensureConfigured();
  try {
    const { tokens } = await fetchAuthSession();
    return tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

export { confirmSignIn };

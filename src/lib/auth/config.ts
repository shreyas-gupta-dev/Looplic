export const cognitoUserPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "";
export const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
export const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "";
export const cognitoRegion = process.env.NEXT_PUBLIC_AWS_REGION || "ap-south-1";
export const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.looplic.com";

export const hasCognitoConfig = Boolean(cognitoUserPoolId && cognitoClientId);

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: cognitoUserPoolId,
      userPoolClientId: cognitoClientId,
      signInWithRedirectUri: `${appUrl}/auth/callback`,
      loginWith: {
        oauth: {
          domain: cognitoDomain,
          scopes: ["email", "profile", "openid"],
          redirectSignIn: [`${appUrl}/auth/callback`],
          redirectSignOut: [`${appUrl}/`],
          responseType: "code" as const,
        },
      },
    },
  },
};

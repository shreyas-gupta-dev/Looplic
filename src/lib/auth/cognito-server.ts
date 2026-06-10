import "server-only";

import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth/server";
import { cookies } from "next/headers";
import { amplifyConfig, cognitoRegion, cognitoUserPoolId, hasCognitoConfig } from "./config";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  AdminDeleteUserCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export type ServerCognitoUser = {
  id: string;
  email: string | undefined;
  name: string | undefined;
};

export const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyConfig,
});

export async function getServerSession(): Promise<{ user: ServerCognitoUser | null }> {
  if (!hasCognitoConfig) return { user: null };

  try {
    const cookieStore = await cookies();

    return await runWithAmplifyServerContext({
      nextServerContext: { cookies: () => cookieStore },
      operation: async (contextSpec) => {
        try {
          const { tokens } = await fetchAuthSession(contextSpec);
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
      },
    });
  } catch {
    return { user: null };
  }
}

const adminClient = new CognitoIdentityProviderClient({
  region: cognitoRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function adminGetUser(email: string) {
  try {
    const response = await adminClient.send(
      new AdminGetUserCommand({
        UserPoolId: cognitoUserPoolId,
        Username: email.toLowerCase(),
      }),
    );
    return response;
  } catch {
    return null;
  }
}

export async function adminListUsers(filter?: string) {
  try {
    const response = await adminClient.send(
      new ListUsersCommand({
        UserPoolId: cognitoUserPoolId,
        Filter: filter,
        Limit: 60,
      }),
    );
    return response.Users || [];
  } catch {
    return [];
  }
}

export async function adminCreateUser(email: string, name: string, tempPassword: string) {
  const response = await adminClient.send(
    new AdminCreateUserCommand({
      UserPoolId: cognitoUserPoolId,
      Username: email.toLowerCase(),
      UserAttributes: [
        { Name: "email", Value: email.toLowerCase() },
        { Name: "name", Value: name },
        { Name: "email_verified", Value: "true" },
      ],
      TemporaryPassword: tempPassword,
      MessageAction: "SUPPRESS",
    }),
  );

  if (response.User?.Username) {
    await adminClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: cognitoUserPoolId,
        Username: email.toLowerCase(),
        Password: tempPassword,
        Permanent: true,
      }),
    );
  }

  return response.User;
}

export async function adminDeleteUser(email: string) {
  await adminClient.send(
    new AdminDeleteUserCommand({
      UserPoolId: cognitoUserPoolId,
      Username: email.toLowerCase(),
    }),
  );
}

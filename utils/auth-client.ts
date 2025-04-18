import { createAuthClient } from "better-auth/react";
import { variables } from "./envVars";

export const authClient = createAuthClient({
  baseURL: variables.BETTER_AUTH_URL,
});

export const { signIn, signUp, useSession } = createAuthClient();

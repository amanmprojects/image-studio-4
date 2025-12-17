import { WorkOS } from "@workos-inc/node";
import { cookies } from "next/headers";

const workos = new WorkOS(process.env.WORKOS_API_KEY!, {
  clientId: process.env.WORKOS_CLIENT_ID!,
});

export { workos };

export const COOKIE_NAME = "wos-session";

export async function getSession() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionData) {
    return { user: null, session: null };
  }

  const session = workos.userManagement.loadSealedSession({
    sessionData,
    cookiePassword: process.env.WORKOS_COOKIE_PASSWORD!,
  });

  const authResult = await session.authenticate();

  if (!authResult.authenticated) {
    return { user: null, session };
  }

  return { user: authResult.user, session };
}

export async function requireAuth() {
  const { user, session } = await getSession();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { user, session };
}


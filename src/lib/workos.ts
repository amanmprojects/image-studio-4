import { WorkOS } from "@workos-inc/node";
import { cookies } from "next/headers";

// Lazy initialization to ensure env vars are available at runtime
let _workos: WorkOS | null = null;

export function getWorkOS(): WorkOS {
  if (!_workos) {
    if (!process.env.WORKOS_API_KEY) {
      throw new Error("WORKOS_API_KEY environment variable is not set");
    }
    _workos = new WorkOS(process.env.WORKOS_API_KEY, {
      clientId: process.env.WORKOS_CLIENT_ID!,
    });
  }
  return _workos;
}

export const COOKIE_NAME = "wos-session";

export async function getSession() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionData) {
    return { user: null, session: null };
  }

  try {
    const workos = getWorkOS();
    const session = workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword: process.env.WORKOS_COOKIE_PASSWORD!,
    });

    const authResult = await session.authenticate();

    if (!authResult.authenticated) {
      return { user: null, session };
    }

    return { user: authResult.user, session };
  } catch (error) {
    console.error("Failed to get session:", error);
    return { user: null, session: null };
  }
}

export async function requireAuth() {
  const { user, session } = await getSession();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { user, session };
}


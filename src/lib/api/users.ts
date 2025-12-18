import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import type { AuthUser } from "@/lib/types";

/**
 * Ensure a user exists in the database, creating them if necessary.
 * This handles the case where a user authenticates but hasn't been synced to our DB yet.
 */
export async function ensureUserExists(user: AuthUser): Promise<void> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!existingUser) {
    await db.insert(users).values({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }
}

import "server-only";

import { cache } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getSession, type SessionPayload } from "@/lib/auth/session";

/**
 * B2B gate: prices and the cart are reserved to accounts created by staff.
 *
 * A signed session cookie alone isn't enough — it stays valid for 30 days,
 * so an account deactivated or deleted in /admin/customers would keep
 * seeing prices until it expired. This re-checks the user row once per
 * request (React `cache`).
 */
export const getActiveSession = cache(async (): Promise<SessionPayload | null> => {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { isActive: true } });
  return user?.isActive ? session : null;
});

export async function canSeePrices(): Promise<boolean> {
  return (await getActiveSession()) != null;
}

/** Like requireUser, but also rejects deactivated/deleted accounts. */
export async function requireActiveUser(nextPath?: string): Promise<SessionPayload> {
  const session = await getActiveSession();
  if (!session) {
    const suffix = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    const locale = await getLocale();
    redirect({ href: `/connexion${suffix}`, locale });
    throw new Error("unreachable"); // redirect() above always throws
  }
  return session;
}

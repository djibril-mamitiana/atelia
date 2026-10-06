"use server";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { customerCodeMatches } from "@/lib/auth/customer-code";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { mergeGuestCartIntoUser } from "@/server/services/cart";
import { loginSchema, type LoginInput } from "@/validations/auth.schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// No registerAction: public sign-up is closed. The shop only sells to
// professionals, whose accounts are created by staff in /admin/customers.

export async function loginAction(input: LoginInput): Promise<AuthActionResult> {
  const ip = await clientIp();
  if (!checkRateLimit(`login:${ip}`, 8, 60_000)) {
    return { success: false, error: "Trop de tentatives. Merci de réessayer dans une minute." };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Formulaire invalide.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { email, code } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  // Customers sign in with the code staff gave them; STAFF/ADMIN keep a
  // password. Same error whether the account exists or not, to avoid
  // leaking which emails are registered.
  const valid = !user
    ? false
    : user.role === "CUSTOMER"
      ? customerCodeMatches(code, user.customerCode)
      : await verifyPassword(code, user.passwordHash);
  if (!user || !valid || !user.isActive) {
    return { success: false, error: "Email ou code client incorrect." };
  }

  await setSessionCookie({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName });
  await mergeGuestCartIntoUser(user.id);

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
}

"use server";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { mergeGuestCartIntoUser } from "@/server/services/cart";
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "@/validations/auth.schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function registerAction(input: RegisterInput): Promise<AuthActionResult> {
  const ip = await clientIp();
  if (!checkRateLimit(`register:${ip}`, 5, 60_000)) {
    return { success: false, error: "Trop de tentatives. Merci de réessayer dans une minute." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Formulaire invalide.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { firstName, lastName, email, password, phone } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cet email." };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { firstName, lastName, email, passwordHash, phone: phone || null },
  });

  await setSessionCookie({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName });
  await mergeGuestCartIntoUser(user.id);

  return { success: true };
}

export async function loginAction(input: LoginInput): Promise<AuthActionResult> {
  const ip = await clientIp();
  if (!checkRateLimit(`login:${ip}`, 8, 60_000)) {
    return { success: false, error: "Trop de tentatives. Merci de réessayer dans une minute." };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Formulaire invalide.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  // Constant-shaped response whether the account exists or not, to avoid
  // leaking which emails are registered.
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid || !user.isActive) {
    return { success: false, error: "Email ou mot de passe incorrect." };
  }

  await setSessionCookie({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName });
  await mergeGuestCartIntoUser(user.id);

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
}

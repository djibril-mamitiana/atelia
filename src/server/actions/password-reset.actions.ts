"use server";

import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { requestPasswordResetSchema, resetPasswordSchema } from "@/validations/auth.schema";
import { SITE_URL } from "@/lib/constants";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordResetAction(email: string) {
  const parsed = requestPasswordResetSchema.safeParse({ email });
  // Always return the same generic message — never reveal whether an
  // account exists for this address.
  const genericResult = { success: true as const };
  if (!parsed.success) return genericResult;

  if (!checkRateLimit(`reset:${parsed.data.email}`, 3, 15 * 60_000)) return genericResult;

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return genericResult;

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: { userId: user.id, token: hashToken(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  const resetUrl = `${SITE_URL}/mot-de-passe-oublie/${token}`;
  await sendEmail({
    to: user.email,
    subject: "Réinitialisation de votre mot de passe",
    text: `Bonjour ${user.firstName},\n\nCliquez sur le lien suivant pour choisir un nouveau mot de passe (valable 1 heure) :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
  });

  return genericResult;
}

export type ResetPasswordResult = { success: true } | { success: false; error: string };

export async function resetPasswordAction(token: string, password: string): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse({ token, password });
  if (!parsed.success) return { success: false, error: "Formulaire invalide." };

  const record = await db.passwordResetToken.findUnique({ where: { token: hashToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { success: false, error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { success: true };
}

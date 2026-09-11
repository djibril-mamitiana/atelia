"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, setSessionCookie } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { profileSchema } from "@/validations/auth.schema";
import { z } from "zod";

export type ProfileActionResult = { success: true } | { success: false; error: string };

export async function updateProfileAction(input: {
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<ProfileActionResult> {
  const session = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Formulaire invalide." };

  const user = await db.user.update({
    where: { id: session.userId },
    data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, phone: parsed.data.phone || null },
  });

  await setSessionCookie({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName });
  revalidatePath("/compte");
  return { success: true };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "8 caractères minimum")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
});

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ProfileActionResult> {
  const session = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return { success: false, error: "Utilisateur introuvable." };

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { success: false, error: "Mot de passe actuel incorrect." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true };
}

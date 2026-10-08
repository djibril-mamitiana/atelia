"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { SITE_SETTINGS_ID } from "@/server/services/site-settings";

const settingsSchema = z.object({
  contactEmail: z.string().trim().toLowerCase().email("Adresse email invalide"),
  contactPhone: z.string().trim().min(4, "Numéro de téléphone requis").max(40),
  shippingStandard: z.coerce.number().min(0, "Le tarif ne peut pas être négatif").max(10_000),
  shippingExpress: z.coerce.number().min(0, "Le tarif ne peut pas être négatif").max(10_000),
});
export type SiteSettingsInput = z.input<typeof settingsSchema>;

export async function updateSiteSettingsAction(
  input: SiteSettingsInput
): Promise<{ success: true } | { success: false; error: string }> {
  // Contact details and delivery prices affect every customer: ADMIN only.
  await requireRole(["ADMIN"]);
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  await db.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...parsed.data },
    update: parsed.data,
  });

  // Header/footer (phone, email) are on every page.
  revalidatePath("/", "layout");
  return { success: true };
}

"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120),
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  subject: z.string().trim().min(1, "Le sujet est requis").max(160),
  message: z.string().trim().min(10, "Merci de détailler votre message").max(4000),
});

export type ContactActionResult = { success: true } | { success: false; error: string };

export async function submitContactAction(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactActionResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`contact:${ip}`, 5, 10 * 60_000)) {
    return { success: false, error: "Trop de messages envoyés. Merci de réessayer plus tard." };
  }

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supportEmail = process.env.SUPPORT_EMAIL || "support@atelia.example";
  await sendEmail({
    to: supportEmail,
    subject: `[Contact] ${parsed.data.subject}`,
    text: `De : ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
  });

  return { success: true };
}

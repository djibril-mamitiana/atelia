"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { z } from "zod";

export type AdminActionResult = { success: true; id: string } | { success: false; error: string };

const tutorialFormSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide"),
  description: z.string().trim().min(10),
  content: z.string().trim().min(10),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url(),
  durationMinutes: z.coerce.number().int().positive(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  categoryId: z.string().optional().or(z.literal("")),
  tagsText: z.string().optional(),
  productIdsText: z.string().optional(),
  isPublished: z.boolean().optional(),
});
export type TutorialFormInput = z.infer<typeof tutorialFormSchema>;

function parseLines(text?: string) {
  return (text ?? "")
    .split(/[\n,]/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function createTutorialAction(input: TutorialFormInput): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const parsed = tutorialFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const data = parsed.data;

  const taken = await db.tutorial.findUnique({ where: { slug: data.slug } });
  if (taken) return { success: false, error: "Ce slug est déjà utilisé." };

  const productIds = parseLines(data.productIdsText);
  const validProducts = productIds.length
    ? await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })
    : [];

  const tutorial = await db.tutorial.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      content: data.content,
      thumbnailUrl: data.thumbnailUrl || null,
      videoUrl: data.videoUrl,
      durationMinutes: data.durationMinutes,
      level: data.level,
      categoryId: data.categoryId || null,
      tags: parseLines(data.tagsText),
      isPublished: data.isPublished ?? true,
      products: { create: validProducts.map((p, i) => ({ productId: p.id, position: i })) },
    },
  });

  revalidatePath("/admin/tutorials");
  revalidatePath("/tutoriels");
  return { success: true, id: tutorial.id };
}

export async function updateTutorialAction(id: string, input: TutorialFormInput): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const existing = await db.tutorial.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Tutoriel introuvable." };

  const parsed = tutorialFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const data = parsed.data;

  if (data.slug !== existing.slug) {
    const taken = await db.tutorial.findUnique({ where: { slug: data.slug } });
    if (taken) return { success: false, error: "Ce slug est déjà utilisé." };
  }

  const productIds = parseLines(data.productIdsText);
  const validProducts = productIds.length
    ? await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })
    : [];

  await db.$transaction(async (tx) => {
    await tx.tutorialProduct.deleteMany({ where: { tutorialId: id } });
    await tx.tutorial.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        content: data.content,
        thumbnailUrl: data.thumbnailUrl || null,
        videoUrl: data.videoUrl,
        durationMinutes: data.durationMinutes,
        level: data.level,
        categoryId: data.categoryId || null,
        tags: parseLines(data.tagsText),
        isPublished: data.isPublished ?? true,
        products: { create: validProducts.map((p, i) => ({ productId: p.id, position: i })) },
      },
    });
  });

  revalidatePath("/admin/tutorials");
  revalidatePath(`/tutoriels/${data.slug}`);
  return { success: true, id };
}

export async function deleteTutorialAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN"]);
  await db.tutorialProduct.deleteMany({ where: { tutorialId: id } });
  await db.tutorial.delete({ where: { id } });
  revalidatePath("/admin/tutorials");
  return { success: true };
}

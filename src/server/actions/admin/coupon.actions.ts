"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { z } from "zod";

export type AdminActionResult = { success: true; id: string } | { success: false; error: string };

const couponFormSchema = z.object({
  code: z.string().trim().min(2).max(40),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive(),
  minPurchase: z.coerce.number().optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  usageLimit: z.coerce.number().int().optional().nullable(),
  usageLimitPerUser: z.coerce.number().int().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
export type CouponFormInput = z.infer<typeof couponFormSchema>;

export async function createCouponAction(input: CouponFormInput): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const parsed = couponFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const data = parsed.data;

  if (data.endsAt <= data.startsAt) return { success: false, error: "La date de fin doit être après la date de début." };

  const code = data.code.toUpperCase();
  const taken = await db.coupon.findUnique({ where: { code } });
  if (taken) return { success: false, error: "Ce code existe déjà." };

  const coupon = await db.coupon.create({
    data: {
      code,
      type: data.type,
      value: data.value,
      minPurchase: data.minPurchase || null,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      usageLimit: data.usageLimit || null,
      usageLimitPerUser: data.usageLimitPerUser ?? 1,
      categoryId: data.categoryId || null,
      productId: data.productId || null,
      isActive: data.isActive ?? true,
    },
  });

  revalidatePath("/admin/promotions");
  return { success: true, id: coupon.id };
}

export async function toggleCouponActiveAction(id: string, isActive: boolean): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN", "STAFF"]);
  await db.coupon.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/promotions");
  return { success: true };
}

export async function deleteCouponAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN"]);

  const usedInOrder = await db.order.findFirst({ where: { couponId: id } });
  if (usedInOrder) {
    return { success: false, error: "Ce code promo a déjà été utilisé sur des commandes et ne peut pas être supprimé — désactivez-le plutôt." };
  }

  await db.couponUsage.deleteMany({ where: { couponId: id } });
  await db.coupon.delete({ where: { id } });
  revalidatePath("/admin/promotions");
  return { success: true };
}

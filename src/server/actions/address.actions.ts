"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { addressSchema, type AddressInput } from "@/validations/auth.schema";

export type AddressActionResult = { success: true; id: string } | { success: false; error: string };

export async function addAddressAction(input: AddressInput): Promise<AddressActionResult> {
  const session = await requireUser();
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Adresse invalide." };
  const data = parsed.data;

  if (data.isDefaultShipping) {
    await db.address.updateMany({ where: { userId: session.userId }, data: { isDefaultShipping: false } });
  }
  if (data.isDefaultBilling) {
    await db.address.updateMany({ where: { userId: session.userId }, data: { isDefaultBilling: false } });
  }

  const address = await db.address.create({
    data: {
      userId: session.userId,
      label: data.label || null,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company || null,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country || "FR",
      phone: data.phone || null,
      isDefaultShipping: data.isDefaultShipping ?? false,
      isDefaultBilling: data.isDefaultBilling ?? false,
    },
  });

  revalidatePath("/compte/adresses");
  revalidatePath("/checkout");
  return { success: true, id: address.id };
}

export async function updateAddressAction(id: string, input: AddressInput): Promise<AddressActionResult> {
  const session = await requireUser();
  const existing = await db.address.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return { success: false, error: "Adresse introuvable." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Adresse invalide." };
  const data = parsed.data;

  if (data.isDefaultShipping) {
    await db.address.updateMany({ where: { userId: session.userId, id: { not: id } }, data: { isDefaultShipping: false } });
  }
  if (data.isDefaultBilling) {
    await db.address.updateMany({ where: { userId: session.userId, id: { not: id } }, data: { isDefaultBilling: false } });
  }

  await db.address.update({
    where: { id },
    data: {
      label: data.label || null,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company || null,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country || "FR",
      phone: data.phone || null,
      isDefaultShipping: data.isDefaultShipping ?? false,
      isDefaultBilling: data.isDefaultBilling ?? false,
    },
  });

  revalidatePath("/compte/adresses");
  return { success: true, id };
}

export async function deleteAddressAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  const session = await requireUser();
  const existing = await db.address.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return { success: false, error: "Adresse introuvable." };

  const usedInOrder = await db.order.findFirst({
    where: { OR: [{ shippingAddressId: id }, { billingAddressId: id }] },
    select: { id: true },
  });
  if (usedInOrder) {
    return { success: false, error: "Cette adresse est utilisée par une commande et ne peut pas être supprimée." };
  }

  await db.address.delete({ where: { id } });
  revalidatePath("/compte/adresses");
  return { success: true };
}

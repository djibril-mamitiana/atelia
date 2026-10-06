"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { normalizeCustomerCode } from "@/lib/auth/customer-code";
import { adminCustomerSchema, type AdminCustomerInput } from "@/validations/auth.schema";

// Pro customer accounts — the only way to get one, since public sign-up is
// closed. Customers sign in with email + customerCode (see auth.actions).

export type AdminCustomerResult = { success: true; id: string } | { success: false; error: string };

const orNull = (v: string | undefined) => v?.trim() || null;

/** Unique-constraint violation → which field clashed, for a readable error. */
function uniqueViolation(err: unknown): string | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return null;
  // Whole `meta`: with driver adapters the field list isn't always in `target`.
  const target = JSON.stringify(err.meta ?? {});
  if (target.includes("customerCode")) return "Ce code client est déjà attribué à un autre compte.";
  if (target.includes("email")) return "Un compte existe déjà avec cet email.";
  return "Ce compte existe déjà.";
}

function revalidate(id?: string) {
  revalidatePath("/admin/customers");
  if (id) revalidatePath(`/admin/customers/${id}`);
}

export async function createCustomerAction(input: AdminCustomerInput): Promise<AdminCustomerResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const parsed = adminCustomerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;

  try {
    const user = await db.user.create({
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        company: orNull(d.company),
        email: d.email,
        phone: orNull(d.phone),
        customerCode: normalizeCustomerCode(d.customerCode),
        isActive: d.isActive,
        role: "CUSTOMER",
        // Required column, never used for customers (they sign in with the
        // code) — a random hash nobody knows the input of.
        passwordHash: await hashPassword(randomBytes(32).toString("hex")),
      },
    });
    revalidate();
    return { success: true, id: user.id };
  } catch (err) {
    const msg = uniqueViolation(err);
    if (msg) return { success: false, error: msg };
    throw err;
  }
}

export async function updateCustomerAction(id: string, input: AdminCustomerInput): Promise<AdminCustomerResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const existing = await db.user.findUnique({ where: { id }, select: { role: true } });
  // Staff accounts aren't managed from this screen.
  if (!existing || existing.role !== "CUSTOMER") return { success: false, error: "Client introuvable." };

  const parsed = adminCustomerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;

  try {
    await db.user.update({
      where: { id },
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        company: orNull(d.company),
        email: d.email,
        phone: orNull(d.phone),
        customerCode: normalizeCustomerCode(d.customerCode),
        isActive: d.isActive,
      },
    });
  } catch (err) {
    const msg = uniqueViolation(err);
    if (msg) return { success: false, error: msg };
    throw err;
  }

  revalidate(id);
  return { success: true, id };
}

export async function deleteCustomerAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN"]);
  const user = await db.user.findUnique({ where: { id }, select: { role: true, _count: { select: { orders: true } } } });
  if (!user || user.role !== "CUSTOMER") return { success: false, error: "Client introuvable." };
  // Orders must stay attached to their customer (invoicing/history).
  if (user._count.orders > 0) {
    return { success: false, error: "Ce client a des commandes — désactivez son compte plutôt que de le supprimer." };
  }

  await db.$transaction([
    // Rows that reference the user without a cascade.
    db.couponUsage.deleteMany({ where: { userId: id } }),
    db.inventoryMovement.updateMany({ where: { createdByUserId: id }, data: { createdByUserId: null } }),
    db.auditLog.updateMany({ where: { userId: id }, data: { userId: null } }),
    db.user.delete({ where: { id } }),
  ]);
  revalidate();
  return { success: true };
}

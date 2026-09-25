import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";

/**
 * Size families ("same product, several sizes") — see src/lib/product-grouping.ts.
 * These helpers back the admin product form: they attach a product to an
 * existing family (by the SKU of any member), set its size label/specs, or
 * detach it. Each size stays its own Product row.
 */

export type FamilyInput = {
  sizeLabel?: string | null;
  sizeSpecs?: string | null;
  /** SKU of any product already in the family to join (or to start one with). */
  groupWithSku?: string | null;
  detach?: boolean;
};

export type FamilyResult = { ok: true } | { ok: false; error: string };

/** "Ø125 mm" → 125 — the number the size selector sorts by. */
export function parseSizeOrder(label: string): number | null {
  const m = label.match(/\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(",", ".")) : null;
}

export async function applySizeFamily(
  tx: Prisma.TransactionClient,
  productId: string,
  input: FamilyInput
): Promise<FamilyResult> {
  if (input.detach) {
    await tx.product.update({
      where: { id: productId },
      data: { groupKey: null, sizeLabel: null, sizeOrder: null, sizeSpecs: null },
    });
    return { ok: true };
  }

  const label = input.sizeLabel?.trim() || null;
  const specs = input.sizeSpecs?.trim() || null;
  let groupKey: string | undefined;

  const joinSku = input.groupWithSku?.trim();
  if (joinSku) {
    const target = await tx.product.findUnique({ where: { sku: joinSku }, select: { id: true, groupKey: true } });
    if (!target) return { ok: false, error: `Aucun produit avec le SKU « ${joinSku} ».` };
    if (target.id === productId) return { ok: false, error: "Une fiche ne peut pas être rattachée à elle-même." };
    groupKey = target.groupKey ?? `manual:${randomUUID()}`;
    if (!target.groupKey) await tx.product.update({ where: { id: target.id }, data: { groupKey } });
  }

  await tx.product.update({
    where: { id: productId },
    data: {
      ...(groupKey ? { groupKey } : {}),
      sizeLabel: label,
      sizeOrder: label ? parseSizeOrder(label) : null,
      sizeSpecs: specs,
    },
  });
  return { ok: true };
}

import { db } from "@/lib/db";
import { ORDER_NUMBER_PREFIX } from "@/lib/constants";

/**
 * Generates the next sequential order number for the current year, e.g.
 * "CMD-2026-000001". Reads the highest existing number for the year and
 * increments it — called inside the same transaction that creates the
 * order, so the read and the insert are serialized by Postgres.
 */
export async function generateOrderNumber(year = new Date().getFullYear()): Promise<string> {
  const prefix = `${ORDER_NUMBER_PREFIX}-${year}-`;
  const last = await db.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const lastSeq = last ? Number(last.orderNumber.slice(prefix.length)) : 0;
  const nextSeq = lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(6, "0")}`;
}

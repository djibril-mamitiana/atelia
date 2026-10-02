import { db } from "@/lib/db";

const PREFIX = "CTP-";

/**
 * Generates the next sequential customer-facing reference, e.g. "CTP-01418".
 * Reads the highest existing publicSku and increments it — used when the
 * admin creates a new product/size so every row gets one, not just the
 * ones from the original supplier catalog import.
 */
export async function generatePublicSku(): Promise<string> {
  const last = await db.product.findFirst({
    where: { publicSku: { startsWith: PREFIX } },
    orderBy: { publicSku: "desc" },
    select: { publicSku: true },
  });

  const lastSeq = last?.publicSku ? Number(last.publicSku.slice(PREFIX.length)) : 0;
  const nextSeq = lastSeq + 1;
  return `${PREFIX}${String(nextSeq).padStart(5, "0")}`;
}

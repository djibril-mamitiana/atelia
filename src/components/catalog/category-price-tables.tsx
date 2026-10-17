import { getLocale, getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { localizePriceTable, type PriceTable } from "@/lib/price-tables";

/**
 * The category's price grids (Admin → Catégories → Tableaux de prix). B2B
 * shop: signed-out visitors see the diameters and columns, not the prices —
 * those are left out of the page entirely, not just hidden.
 */
export async function CategoryPriceTables({ tables, showPrices, signInPath }: { tables: PriceTable[]; showPrices: boolean; signInPath: string }) {
  if (tables.length === 0) return null;
  const [t, locale] = await Promise.all([getTranslations("Catalog"), getLocale()]);

  return (
    <section className="mt-8 flex flex-col gap-6">
      <h2 className="font-display text-2xl text-ink">{t("priceTablesTitle")}</h2>
      {!showPrices && (
        <p className="flex flex-wrap items-center gap-2 rounded-md bg-paper px-4 py-3 text-sm text-ink-soft">
          <Lock size={15} className="text-accent-dark" />
          {t("priceTablesLocked")}
          <Link href={`/connexion?next=${encodeURIComponent(signInPath)}`} className="font-medium text-accent-dark underline underline-offset-2">
            {t("priceTablesSignIn")}
          </Link>
        </p>
      )}
      {tables.map((table, i) => {
        const { title, headers, rows } = localizePriceTable(table, locale);
        return (
          <div key={i}>
            <h3 className="mb-3 text-lg font-medium text-ink">{title}</h3>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-graphite text-xs uppercase tracking-wide text-white">
                  <tr>
                    {headers.map((h, c) => (
                      <th key={c} className={`px-3 py-2.5 font-medium ${c === 0 ? "text-left" : "text-right"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, r) => (
                    <tr key={r} className="odd:bg-paper/60">
                      {row.map((value, c) =>
                        c === 0 ? (
                          <td key={c} className="whitespace-nowrap px-3 py-2 font-medium text-ink">
                            {value}
                          </td>
                        ) : (
                          <td key={c} className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-ink-soft">
                            {value === "" ? "" : showPrices ? value : "•••"}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </section>
  );
}

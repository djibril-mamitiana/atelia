"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import { localizeSpecValue, tableColumns, type SpecCell, type SpecKey } from "@/lib/spec-table";
import { cn } from "@/lib/utils";
import { useSizeSelection } from "@/components/product/size-selection";
import type { SizeOption } from "@/components/product/add-to-cart-panel";

type Locale = "fr" | "de" | "en" | "it";

/**
 * Catalogue-style table of a product's sizes, full width under the photos:
 * Ø | Segment | Alésage | Segments… | Réf. | Prix | Stock (prices only for
 * signed-in pros). A click on a row selects that size in the purchase box.
 * A standalone product gets the same table with its one row.
 */
export function SizeTable({ sizes, specCells, publicSku }: { sizes: SizeOption[]; specCells: SpecCell[] | null; publicSku: string }) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const multi = sizes.length > 1;
  const { sizeId, setSizeId } = useSizeSelection(sizes[0]?.id ?? "");

  const rows = multi ? sizes : [];
  // Named columns when every size has them; otherwise the specs text in one column.
  const columns: SpecKey[] | null = multi ? (rows.every((r) => r.cells) ? tableColumns(rows.map((r) => r.cells)) : null) : specCells ? tableColumns([specCells]) : null;
  if (!multi && !columns) return null;

  const showPrices = rows.some((r) => r.price != null);
  // Sizes always need a name: without a Ø column, the size label leads.
  const sizeColumn = multi && columns != null && !columns.includes("diameter");
  const cell = (cells: SpecCell[] | null, key: SpecKey) => {
    const value = cells?.find(([k]) => k === key)?.[1];
    return value ? localizeSpecValue(value, locale) : "—";
  };
  const th = "whitespace-nowrap px-3 py-2.5 font-medium";
  const td = "whitespace-nowrap px-3 py-2.5";

  const choose = (id: string) => {
    setSizeId(id);
    // On a phone the purchase box sits above: bring it back into view.
    document.getElementById("buy-box")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <section id="tailles" aria-labelledby="size-table-title" className="mt-10 lg:mt-14">
      <h2 id="size-table-title" className="mb-4 font-display text-2xl text-ink">
        {multi ? t("sizeTableTitle") : t("specTableTitle")}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-graphite text-xs uppercase tracking-wide text-white">
            <tr>
              {multi && <th className={cn(th, "w-10")} aria-label={t("colChoose")} />}
              {sizeColumn && <th className={th}>{t("colSize")}</th>}
              {columns ? columns.map((key) => <th key={key} className={th}>{t(`specCols.${key}`)}</th>) : (
                <>
                  <th className={th}>{t("colSize")}</th>
                  <th className={th}>{t("colSpecs")}</th>
                </>
              )}
              <th className={th}>{t("colRef")}</th>
              {showPrices && <th className={cn(th, "text-right")}>{t("colPrice")}</th>}
              {multi && <th className={th}>{t("colStock")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {multi ? (
              rows.map((sz) => {
                const active = sz.id === sizeId;
                return (
                  <tr key={sz.id} onClick={() => choose(sz.id)} className={cn("cursor-pointer transition-colors", active ? "bg-accent-soft" : "odd:bg-paper/60 hover:bg-paper")}>
                    <td className={td}>
                      <input
                        type="radio"
                        name="size-table"
                        checked={active}
                        onChange={() => choose(sz.id)}
                        aria-label={sz.sizeLabel}
                        className="accent-accent"
                      />
                    </td>
                    {sizeColumn && <td className={cn(td, "font-medium text-ink")}>{sz.sizeLabel}</td>}
                    {columns ? (
                      columns.map((key, i) => (
                        <td key={key} className={cn(td, i === 0 && !sizeColumn ? "font-medium text-ink" : "text-ink-soft")}>
                          {cell(sz.cells, key)}
                        </td>
                      ))
                    ) : (
                      <>
                        <td className={cn(td, "font-medium text-ink")}>{sz.sizeLabel}</td>
                        <td className="px-3 py-2.5 text-xs text-muted">{sz.specs ?? "—"}</td>
                      </>
                    )}
                    <td className={cn(td, "font-mono text-xs text-muted")}>{sz.publicSku}</td>
                    {showPrices && <td className={cn(td, "text-right font-medium text-ink")}>{sz.price != null ? formatPrice(sz.price, locale) : "—"}</td>}
                    <td className={cn(td, "text-xs", sz.stock > 0 ? "text-sage" : "text-danger")}>{sz.stock > 0 ? t("inStock") : t("outOfStockBadge")}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                {columns!.map((key, i) => (
                  <td key={key} className={cn(td, i === 0 ? "font-medium text-ink" : "text-ink-soft")}>
                    {cell(specCells, key)}
                  </td>
                ))}
                <td className={cn(td, "font-mono text-xs text-muted")}>{publicSku}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseHeaderLine, parsePriceTableText, priceTableText, type PriceTable } from "@/lib/price-tables";

type Draft = { titleFr: string; titleDe: string; titleEn: string; titleIt: string; text: string; headersDe: string; headersEn: string; headersIt: string };

const toDraft = (t: PriceTable): Draft => ({
  titleFr: t.title.fr,
  titleDe: t.title.de ?? "",
  titleEn: t.title.en ?? "",
  titleIt: t.title.it ?? "",
  text: priceTableText(t),
  headersDe: (t.headers.de ?? []).join("\t"),
  headersEn: (t.headers.en ?? []).join("\t"),
  headersIt: (t.headers.it ?? []).join("\t"),
});

const toTable = (d: Draft): PriceTable => {
  const { headers, rows } = parsePriceTableText(d.text);
  return {
    title: { fr: d.titleFr, de: d.titleDe, en: d.titleEn, it: d.titleIt },
    headers: { fr: headers, de: parseHeaderLine(d.headersDe), en: parseHeaderLine(d.headersEn), it: parseHeaderLine(d.headersIt) },
    rows,
  };
};

const EMPTY: Draft = { titleFr: "", titleDe: "", titleEn: "", titleIt: "", text: "", headersDe: "", headersEn: "", headersIt: "" };

/**
 * A category's price grids: paste the cells straight from Excel (first line =
 * column titles, first column = diameter). Titles and column titles can be
 * translated; empty = French shown.
 */
export function PriceTablesEditor({ value, onChange }: { value: PriceTable[]; onChange: (tables: PriceTable[]) => void }) {
  const t = useTranslations("Admin.Categories");
  // The textareas keep what was typed (a trailing tab, a blank line…); the form gets the parsed tables.
  const [drafts, setDrafts] = useState<Draft[]>(() => value.map(toDraft));

  const update = (next: Draft[]) => {
    setDrafts(next);
    onChange(next.filter((d) => d.titleFr.trim() && d.text.trim()).map(toTable));
  };
  const edit = (i: number, patch: Partial<Draft>) => update(drafts.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  return (
    <div className="flex flex-col gap-4">
      {drafts.map((d, i) => {
        const parsed = parsePriceTableText(d.text);
        return (
          <div key={i} className="flex flex-col gap-3 rounded-md border border-border p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>{t("priceTableTitle")}</Label>
                <Input value={d.titleFr} onChange={(e) => edit(i, { titleFr: e.target.value })} placeholder="Couronnes à eau : neuve et rebrasage" />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => update(drafts.filter((_, j) => j !== i))} aria-label={t("priceTableRemove")}>
                <Trash2 size={15} />
              </Button>
            </div>
            <div>
              <Label>{t("priceTableCells")}</Label>
              <Textarea rows={6} value={d.text} onChange={(e) => edit(i, { text: e.target.value })} placeholder={"Diamètre\tNeuve\tRebrasage\n25\t24,00 €\t16,00 €"} className="font-mono text-xs" />
              <p className="mt-1 text-xs text-muted">{t("priceTableHint", { columns: parsed.headers.length, rows: parsed.rows.length })}</p>
            </div>
            <details>
              <summary className="cursor-pointer text-xs font-medium text-ink-soft">{t("priceTableTranslations")}</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(["De", "En", "It"] as const).map((l) => (
                  <div key={l} className="contents">
                    <Input value={d[`title${l}`]} onChange={(e) => edit(i, { [`title${l}`]: e.target.value })} placeholder={`${t("priceTableTitle")} (${l.toUpperCase()})`} />
                    <Input value={d[`headers${l}`]} onChange={(e) => edit(i, { [`headers${l}`]: e.target.value })} placeholder={`${t("priceTableHeaders")} (${l.toUpperCase()})`} />
                  </div>
                ))}
              </div>
            </details>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => update([...drafts, EMPTY])} className="self-start">
        <Plus size={15} /> {t("priceTableAdd")}
      </Button>
    </div>
  );
}

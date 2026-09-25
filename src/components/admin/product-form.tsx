"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import slugify from "slugify";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  createProductAction,
  updateProductAction,
  type AdminProductFormInput,
  type AdminSizeInput,
} from "@/server/actions/admin/product.actions";

type Category = { id: string; name: string };
type Brand = { id: string; name: string };

const EMPTY_SIZE: AdminSizeInput = {
  sku: "",
  sizeLabel: "",
  sizeSpecs: "",
  price: 0,
  compareAtPrice: null,
  stock: 0,
  lowStockThreshold: 5,
  isActive: true,
};

const EMPTY: AdminProductFormInput = {
  slug: "",
  name: "",
  description: "",
  shortDescription: "",
  nameFr: "",
  nameEn: "",
  nameIt: "",
  descriptionFr: "",
  descriptionEn: "",
  descriptionIt: "",
  shortDescriptionFr: "",
  shortDescriptionEn: "",
  shortDescriptionIt: "",
  taxRate: 20,
  categoryId: "",
  brandId: "",
  isFeatured: false,
  isNew: false,
  isBestSeller: false,
  seoTitle: "",
  seoDescription: "",
  imagesText: "",
  attributesText: "",
  variantsText: "",
  sizes: [EMPTY_SIZE],
};

// The storefront shows the fr/en/it columns when filled and falls back to the
// source-language (German) columns otherwise — one tab per language.
type Lang = "fr" | "de" | "en" | "it";
const LANGS: Lang[] = ["fr", "de", "en", "it"];
const TEXT_FIELDS = {
  fr: { name: "nameFr", description: "descriptionFr", short: "shortDescriptionFr" },
  de: { name: "name", description: "description", short: "shortDescription" },
  en: { name: "nameEn", description: "descriptionEn", short: "shortDescriptionEn" },
  it: { name: "nameIt", description: "descriptionIt", short: "shortDescriptionIt" },
} as const;

function firstName(f: Partial<AdminProductFormInput>) {
  return [f.name, f.nameFr, f.nameEn, f.nameIt].map((v) => v?.trim()).find(Boolean) ?? "";
}

/**
 * One form = one product with all its sizes. `familyOf` is the id of any size of
 * the product being edited (omitted when creating).
 */
export function ProductForm({
  categories,
  brands,
  familyOf,
  initial,
}: {
  categories: Category[];
  brands: Brand[];
  familyOf?: string;
  initial?: Partial<AdminProductFormInput>;
}) {
  const t = useTranslations("Admin.ProductForm");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<AdminProductFormInput>(() => ({ ...EMPTY, ...initial }));
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [lang, setLang] = useState<Lang>("fr");
  const fields = TEXT_FIELDS[lang];
  const multi = form.sizes.length > 1;

  function set<K extends keyof AdminProductFormInput>(key: K, value: AdminProductFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((f) => {
      const next = { ...f, [fields.name]: value };
      if (!slugEdited) next.slug = slugify(firstName(next), { lower: true, strict: true, locale: "fr" });
      return next;
    });
  }

  function setSize(index: number, patch: Partial<AdminSizeInput>) {
    setForm((f) => ({ ...f, sizes: f.sizes.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));
  }

  function addSize() {
    setForm((f) => {
      const last = f.sizes[f.sizes.length - 1];
      return { ...f, sizes: [...f.sizes, { ...EMPTY_SIZE, price: last?.price ?? 0, lowStockThreshold: last?.lowStockThreshold ?? 5 }] };
    });
  }

  function removeSize(index: number) {
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, i) => i !== index) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = familyOf ? await updateProductAction(familyOf, form) : await createProductAction(form);
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      toast(familyOf ? t("toastUpdated") : t("toastCreated"), "success");
      router.push("/admin/products");
    });
  }

  const HIGHLIGHT_LABELS = {
    isFeatured: t("checkboxFeatured"),
    isNew: t("checkboxNew"),
    isBestSeller: t("checkboxBestSeller"),
  } as const;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">{t("sectionGeneral")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs text-muted">{t("languagesHint")}</p>
            <div role="tablist" className="flex gap-1.5">
              {LANGS.map((l) => {
                const f = TEXT_FIELDS[l];
                const filled = Boolean(form[f.name]?.trim() || form[f.description]?.trim());
                return (
                  <button
                    key={l}
                    type="button"
                    role="tab"
                    aria-selected={lang === l}
                    onClick={() => setLang(l)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      lang === l ? "border-ink bg-ink text-white" : "border-border-strong text-muted hover:text-ink"
                    }`}
                  >
                    {t(`lang_${l}`)}
                    <span className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full ${filled ? "bg-sage" : "bg-border-strong"}`} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="name">{t("labelName")}</Label>
            <Input id="name" value={form[fields.name] ?? ""} onChange={(e) => handleNameChange(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="slug">{t("labelSlug")}</Label>
            <Input
              id="slug"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                set("slug", e.target.value);
              }}
            />
          </div>
          <div>
            <Label htmlFor="categoryId">{t("labelCategory")}</Label>
            <Select id="categoryId" required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">{t("choosePlaceholder")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="brandId">{t("labelBrand")}</Label>
            <Select id="brandId" required value={form.brandId} onChange={(e) => set("brandId", e.target.value)}>
              <option value="">{t("choosePlaceholder")}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="shortDescription">{t("labelShortDescription")}</Label>
          <Input id="shortDescription" value={form[fields.short] ?? ""} onChange={(e) => set(fields.short, e.target.value)} />
        </div>
        <div className="mt-4">
          <Label htmlFor="description">{t("labelDescription")}</Label>
          <Textarea id="description" rows={5} value={form[fields.description] ?? ""} onChange={(e) => set(fields.description, e.target.value)} />
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-1 font-medium text-ink">{t("sectionSizes")}</p>
        <p className="mb-4 text-xs text-muted">{multi ? t("sizesHint") : t("singleSizeHint")}</p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 pr-2 font-medium">{t("colSize")}</th>
                <th className="pb-2 pr-2 font-medium">{t("colSku")}</th>
                <th className="pb-2 pr-2 font-medium">{t("colSpecs")}</th>
                <th className="pb-2 pr-2 font-medium">{t("colPrice")}</th>
                <th className="pb-2 pr-2 font-medium">{t("colComparePrice")}</th>
                <th className="pb-2 pr-2 font-medium">{t("colStock")}</th>
                <th className="pb-2 pr-2 font-medium">{t("colActive")}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {form.sizes.map((s, i) => (
                <tr key={s.id ?? `new-${i}`} className="align-top">
                  <td className="py-1 pr-2">
                    <Input aria-label={t("colSize")} value={s.sizeLabel} onChange={(e) => setSize(i, { sizeLabel: e.target.value })} placeholder={multi ? "Ø125 mm" : ""} className="w-28" />
                  </td>
                  <td className="py-1 pr-2">
                    <Input aria-label={t("colSku")} required value={s.sku} onChange={(e) => setSize(i, { sku: e.target.value })} className="w-40" />
                  </td>
                  <td className="py-1 pr-2">
                    <Input aria-label={t("colSpecs")} value={s.sizeSpecs} onChange={(e) => setSize(i, { sizeSpecs: e.target.value })} placeholder={multi ? "37x2,0x7 mm · 22,2 mm" : ""} className="w-56" />
                  </td>
                  <td className="py-1 pr-2">
                    <Input aria-label={t("colPrice")} type="number" step="0.01" required value={s.price} onChange={(e) => setSize(i, { price: Number(e.target.value) })} className="w-24" />
                  </td>
                  <td className="py-1 pr-2">
                    <Input
                      aria-label={t("colComparePrice")}
                      type="number"
                      step="0.01"
                      value={s.compareAtPrice ?? ""}
                      onChange={(e) => setSize(i, { compareAtPrice: e.target.value ? Number(e.target.value) : null })}
                      className="w-24"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <Input aria-label={t("colStock")} type="number" min={0} value={s.stock} onChange={(e) => setSize(i, { stock: Number(e.target.value) })} className="w-20" />
                  </td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="checkbox"
                      aria-label={t("colActive")}
                      checked={s.isActive}
                      onChange={(e) => setSize(i, { isActive: e.target.checked })}
                      className="h-4 w-4 accent-accent"
                    />
                  </td>
                  <td className="py-2.5">
                    {form.sizes.length > 1 && (
                      <button type="button" onClick={() => removeSize(i)} aria-label={t("removeSize")} title={t("removeSize")} className="text-muted hover:text-danger">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <Button type="button" variant="outline" size="sm" onClick={addSize}>
            <Plus size={15} /> {t("addSizeRow")}
          </Button>
          <div className="w-32">
            <Label htmlFor="taxRate">{t("labelTaxRate")}</Label>
            <Input id="taxRate" type="number" step="0.1" value={form.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">{t("sectionHighlight")}</p>
        <div className="flex flex-wrap gap-5">
          {(["isFeatured", "isNew", "isBestSeller"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-accent" />
              {HIGHLIGHT_LABELS[key]}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-1 font-medium text-ink">{t("sectionImages")}</p>
        <p className="mb-3 text-xs text-muted">{t("imagesHint")}</p>
        <Textarea rows={4} value={form.imagesText} onChange={(e) => set("imagesText", e.target.value)} placeholder="https://…" />
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-1 font-medium text-ink">{t("sectionAttributes")}</p>
        <p className="mb-3 text-xs text-muted">{t("attributesHint")}</p>
        <Textarea rows={4} value={form.attributesText} onChange={(e) => set("attributesText", e.target.value)} placeholder="Puissance: 18V" />
      </section>

      {!multi && (
        <section className="rounded-md border border-border bg-surface p-5">
          <p className="mb-1 font-medium text-ink">{t("sectionVariants")}</p>
          <p className="mb-3 text-xs text-muted">{t("variantsHint")}</p>
          <Textarea rows={4} value={form.variantsText} onChange={(e) => set("variantsText", e.target.value)} placeholder="Rouge | ABC-RED | 0 | 10" />
        </section>
      )}

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">{t("sectionSeo")}</p>
        <div>
          <Label htmlFor="seoTitle">{t("labelSeoTitle")}</Label>
          <Input id="seoTitle" value={form.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} />
        </div>
        <div className="mt-4">
          <Label htmlFor="seoDescription">{t("labelSeoDescription")}</Label>
          <Textarea id="seoDescription" rows={2} value={form.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} />
        </div>
      </section>

      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? t("saving") : familyOf ? t("submitUpdate") : t("submitCreate")}
      </Button>
    </form>
  );
}

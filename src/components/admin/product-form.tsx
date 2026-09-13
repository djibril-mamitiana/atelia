"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import slugify from "slugify";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createProductAction, updateProductAction, type AdminProductFormInput } from "@/server/actions/admin/product.actions";

type Category = { id: string; name: string };
type Brand = { id: string; name: string };

const EMPTY: AdminProductFormInput = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  shortDescription: "",
  price: 0,
  compareAtPrice: null,
  taxRate: 20,
  stock: 0,
  lowStockThreshold: 5,
  categoryId: "",
  brandId: "",
  isActive: true,
  isFeatured: false,
  isNew: false,
  isBestSeller: false,
  seoTitle: "",
  seoDescription: "",
  imagesText: "",
  attributesText: "",
  variantsText: "",
};

export function ProductForm({
  categories,
  brands,
  productId,
  initial,
}: {
  categories: Category[];
  brands: Brand[];
  productId?: string;
  initial?: Partial<AdminProductFormInput>;
}) {
  const t = useTranslations("Admin.ProductForm");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<AdminProductFormInput>({ ...EMPTY, ...initial });
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));

  function set<K extends keyof AdminProductFormInput>(key: K, value: AdminProductFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(name: string) {
    set("name", name);
    if (!slugEdited) {
      set("slug", slugify(name, { lower: true, strict: true, locale: "fr" }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = productId ? await updateProductAction(productId, form) : await createProductAction(form);
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      toast(productId ? t("toastUpdated") : t("toastCreated"), "success");
      router.push("/admin/products");
    });
  }

  const HIGHLIGHT_LABELS = {
    isActive: t("checkboxActive"),
    isFeatured: t("checkboxFeatured"),
    isNew: t("checkboxNew"),
    isBestSeller: t("checkboxBestSeller"),
  } as const;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">{t("sectionGeneral")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">{t("labelName")}</Label>
            <Input id="name" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
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
            <Label htmlFor="sku">{t("labelSku")}</Label>
            <Input id="sku" required value={form.sku} onChange={(e) => set("sku", e.target.value)} />
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
          <Input id="shortDescription" value={form.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} />
        </div>
        <div className="mt-4">
          <Label htmlFor="description">{t("labelDescription")}</Label>
          <Textarea id="description" required rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">{t("sectionPricing")}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="price">{t("labelPrice")}</Label>
            <Input id="price" type="number" step="0.01" required value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="compareAtPrice">{t("labelCompareAtPrice")}</Label>
            <Input
              id="compareAtPrice"
              type="number"
              step="0.01"
              value={form.compareAtPrice ?? ""}
              onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <Label htmlFor="taxRate">{t("labelTaxRate")}</Label>
            <Input id="taxRate" type="number" step="0.1" value={form.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="stock">{t("labelStock")}</Label>
            <Input id="stock" type="number" value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="lowStockThreshold">{t("labelLowStockThreshold")}</Label>
            <Input id="lowStockThreshold" type="number" value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">{t("sectionHighlight")}</p>
        <div className="flex flex-wrap gap-5">
          {(["isActive", "isFeatured", "isNew", "isBestSeller"] as const).map((key) => (
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

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-1 font-medium text-ink">{t("sectionVariants")}</p>
        <p className="mb-3 text-xs text-muted">{t("variantsHint")}</p>
        <Textarea rows={4} value={form.variantsText} onChange={(e) => set("variantsText", e.target.value)} placeholder="Rouge | ABC-RED | 0 | 10" />
      </section>

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
        {pending ? t("saving") : productId ? t("submitUpdate") : t("submitCreate")}
      </Button>
    </form>
  );
}

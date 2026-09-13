"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import slugify from "slugify";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { createBrandAction, updateBrandAction, deleteBrandAction } from "@/server/actions/admin/brand.actions";
import type { BrandInput } from "@/validations/product.schema";

type Brand = BrandInput & { id: string; productCount: number };

const EMPTY: BrandInput = { name: "", slug: "", logoUrl: "", description: "", website: "", isActive: true };

export function BrandManager({ initialBrands }: { initialBrands: Brand[] }) {
  const t = useTranslations("Admin.Brands");
  const { toast } = useToast();
  const [brands, setBrands] = useState(initialBrands);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<BrandInput>(EMPTY);
  const [slugEdited, setSlugEdited] = useState(false);

  function set<K extends keyof BrandInput>(key: K, value: BrandInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleAdd() {
    startTransition(async () => {
      const result = await createBrandAction(form);
      if (!result.success) return toast(result.error, "error");
      setBrands((prev) => [...prev, { ...form, id: result.id, productCount: 0 }]);
      setAdding(false);
      setForm(EMPTY);
      toast(t("toastCreated"), "success");
    });
  }

  function handleUpdate() {
    if (!editingId) return;
    startTransition(async () => {
      const result = await updateBrandAction(editingId, form);
      if (!result.success) return toast(result.error, "error");
      setBrands((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...form } : b)));
      setEditingId(null);
      toast(t("toastUpdated"), "success");
    });
  }

  function handleDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deleteBrandAction(id);
      if (!result.success) return toast(result.error, "error");
      setBrands((prev) => prev.filter((b) => b.id !== id));
      toast(t("toastDeleted"), "success");
    });
  }

  function renderForm(onSave: () => void, onCancel?: () => void) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-ink p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{t("labelName")}</Label>
            <Input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugEdited) set("slug", slugify(e.target.value, { lower: true, strict: true, locale: "fr" }));
              }}
            />
          </div>
          <div>
            <Label>{t("labelSlug")}</Label>
            <Input value={form.slug} onChange={(e) => { setSlugEdited(true); set("slug", e.target.value); }} />
          </div>
          <div>
            <Label>{t("labelLogo")}</Label>
            <Input value={form.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} />
          </div>
          <div>
            <Label>{t("labelWebsite")}</Label>
            <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("labelDescription")}</Label>
            <Textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-accent" />
          {t("activeCheckbox")}
        </label>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={pending}>{t("save")}</Button>
          {onCancel && <Button size="sm" variant="ghost" onClick={onCancel}>{t("cancel")}</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {brands.map((brand) =>
        editingId === brand.id ? (
          <div key={brand.id}>{renderForm(handleUpdate, () => setEditingId(null))}</div>
        ) : (
          <div key={brand.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-4">
            <div className="text-sm">
              <p className="font-medium text-ink">
                {brand.name} <Badge tone={brand.isActive ? "sage" : "neutral"} className="ml-2">{brand.isActive ? t("activeBadge") : t("inactiveBadge")}</Badge>
              </p>
              <p className="text-xs text-muted">{t("productsCount", { count: brand.productCount })}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(brand.id);
                  setForm(brand);
                  setSlugEdited(true);
                  setAdding(false);
                }}
                className="text-muted hover:text-ink"
              >
                <Pencil size={15} />
              </button>
              <button onClick={() => handleDelete(brand.id)} className="text-muted hover:text-danger"><Trash2 size={15} /></button>
            </div>
          </div>
        )
      )}

      {adding ? (
        renderForm(handleAdd, () => setAdding(false))
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            setForm(EMPTY);
            setSlugEdited(false);
            setAdding(true);
          }}
        >
          <Plus size={16} /> {t("newBrand")}
        </Button>
      )}
    </div>
  );
}

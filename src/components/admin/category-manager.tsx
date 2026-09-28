"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import slugify from "slugify";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/server/actions/admin/category.actions";
import { localizedCategoryName } from "@/lib/category-name";
import type { CategoryInput } from "@/validations/product.schema";

type ParentRef = { id: string; name: string; nameDe: string | null; nameEn: string | null; nameIt: string | null };
type Category = CategoryInput & { id: string; parent?: ParentRef | null; productCount: number };

const EMPTY: CategoryInput = {
  name: "",
  slug: "",
  description: "",
  nameDe: "",
  nameEn: "",
  nameIt: "",
  descriptionDe: "",
  descriptionEn: "",
  descriptionIt: "",
  imageUrl: "",
  parentId: null,
  order: 0,
  isActive: true,
};

// French is the source language here (matches Category/Brand/Tutorial in the
// schema) — the "fr" tab maps to name/description, the others to the
// nameDe/nameEn/nameIt overrides.
type Lang = "fr" | "de" | "en" | "it";
const LANGS: Lang[] = ["fr", "de", "en", "it"];
const TEXT_FIELDS = {
  fr: { name: "name", description: "description" },
  de: { name: "nameDe", description: "descriptionDe" },
  en: { name: "nameEn", description: "descriptionEn" },
  it: { name: "nameIt", description: "descriptionIt" },
} as const;

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const t = useTranslations("Admin.Categories");
  const locale = useLocale();
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<CategoryInput>(EMPTY);
  const [slugEdited, setSlugEdited] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");
  const fields = TEXT_FIELDS[lang];

  function set<K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setForm(cat);
    setSlugEdited(true);
    setAdding(false);
    setLang("fr");
  }

  function handleAdd() {
    startTransition(async () => {
      const result = await createCategoryAction(form);
      if (!result.success) return toast(result.error, "error");
      setCategories((prev) => [...prev, { ...form, id: result.id, productCount: 0 }]);
      setAdding(false);
      setForm(EMPTY);
      toast(t("toastCreated"), "success");
    });
  }

  function handleUpdate() {
    if (!editingId) return;
    startTransition(async () => {
      const result = await updateCategoryAction(editingId, form);
      if (!result.success) return toast(result.error, "error");
      setCategories((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...form } : c)));
      setEditingId(null);
      toast(t("toastUpdated"), "success");
    });
  }

  function handleDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) return toast(result.error, "error");
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast(t("toastDeleted"), "success");
    });
  }

  function renderForm(onSave: () => void, onCancel?: () => void) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-ink p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs text-muted">{t("languagesHint")}</p>
            <div role="tablist" className="flex gap-1.5">
              {LANGS.map((l) => {
                const f = TEXT_FIELDS[l];
                const filled = Boolean(form[f.name]?.trim());
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
          <div>
            <Label>{t("labelName")}</Label>
            <Input
              value={form[fields.name] ?? ""}
              onChange={(e) => {
                set(fields.name, e.target.value);
                if (!slugEdited && lang === "fr") set("slug", slugify(e.target.value, { lower: true, strict: true, locale: "fr" }));
              }}
            />
          </div>
          <div>
            <Label>{t("labelSlug")}</Label>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                set("slug", e.target.value);
              }}
            />
          </div>
          <div>
            <Label>{t("labelParent")}</Label>
            <Select value={form.parentId ?? ""} onChange={(e) => set("parentId", e.target.value || null)}>
              <option value="">{t("noneRoot")}</option>
              {categories.filter((c) => c.id !== editingId).map((c) => (
                <option key={c.id} value={c.id}>{localizedCategoryName(c, locale)}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t("labelOrder")}</Label>
            <Input type="number" value={form.order} onChange={(e) => set("order", Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("labelImage")}</Label>
            <Input value={form.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("labelDescription")}</Label>
            <Textarea rows={2} value={form[fields.description] ?? ""} onChange={(e) => set(fields.description, e.target.value)} />
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
      {categories.map((cat) =>
        editingId === cat.id ? (
          <div key={cat.id}>{renderForm(handleUpdate, () => setEditingId(null))}</div>
        ) : (
          <div key={cat.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-4">
            <div className="text-sm">
              <p className="font-medium text-ink">
                {cat.parent && <span className="text-muted">{localizedCategoryName(cat.parent, locale)} / </span>}
                {localizedCategoryName(cat, locale)}{" "}
                <Badge tone={cat.isActive ? "sage" : "neutral"} className="ml-2">{cat.isActive ? t("activeBadge") : t("inactiveBadge")}</Badge>
              </p>
              <p className="text-xs text-muted">{t("productsCount", { count: cat.productCount, slug: cat.slug })}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(cat)} className="text-muted hover:text-ink"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(cat.id)} className="text-muted hover:text-danger"><Trash2 size={15} /></button>
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
            setLang("fr");
            setAdding(true);
          }}
        >
          <Plus size={16} /> {t("newCategory")}
        </Button>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import slugify from "slugify";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/server/actions/admin/category.actions";
import type { CategoryInput } from "@/validations/product.schema";

type Category = CategoryInput & { id: string; parentName?: string | null; productCount: number };

const EMPTY: CategoryInput = { name: "", slug: "", description: "", imageUrl: "", parentId: null, order: 0, isActive: true };

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<CategoryInput>(EMPTY);
  const [slugEdited, setSlugEdited] = useState(false);

  function set<K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setForm(cat);
    setSlugEdited(true);
    setAdding(false);
  }

  function handleAdd() {
    startTransition(async () => {
      const result = await createCategoryAction(form);
      if (!result.success) return toast(result.error, "error");
      setCategories((prev) => [...prev, { ...form, id: result.id, productCount: 0 }]);
      setAdding(false);
      setForm(EMPTY);
      toast("Catégorie créée.", "success");
    });
  }

  function handleUpdate() {
    if (!editingId) return;
    startTransition(async () => {
      const result = await updateCategoryAction(editingId, form);
      if (!result.success) return toast(result.error, "error");
      setCategories((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...form } : c)));
      setEditingId(null);
      toast("Catégorie mise à jour.", "success");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) return toast(result.error, "error");
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast("Catégorie supprimée.", "success");
    });
  }

  function renderForm(onSave: () => void, onCancel?: () => void) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-ink p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nom</Label>
            <Input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugEdited) set("slug", slugify(e.target.value, { lower: true, strict: true, locale: "fr" }));
              }}
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                set("slug", e.target.value);
              }}
            />
          </div>
          <div>
            <Label>Catégorie parente</Label>
            <Select value={form.parentId ?? ""} onChange={(e) => set("parentId", e.target.value || null)}>
              <option value="">Aucune (catégorie racine)</option>
              {categories.filter((c) => c.id !== editingId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Ordre d&apos;affichage</Label>
            <Input type="number" value={form.order} onChange={(e) => set("order", Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <Label>Image (URL)</Label>
            <Input value={form.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-accent" />
          Active
        </label>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={pending}>Enregistrer</Button>
          {onCancel && <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>}
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
                {cat.parentName && <span className="text-muted">{cat.parentName} / </span>}
                {cat.name} <Badge tone={cat.isActive ? "sage" : "neutral"} className="ml-2">{cat.isActive ? "Active" : "Inactive"}</Badge>
              </p>
              <p className="text-xs text-muted">{cat.productCount} produits · /{cat.slug}</p>
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
            setAdding(true);
          }}
        >
          <Plus size={16} /> Nouvelle catégorie
        </Button>
      )}
    </div>
  );
}

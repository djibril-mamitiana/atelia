"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
      toast(productId ? "Produit mis à jour." : "Produit créé.", "success");
      router.push("/admin/products");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">Informations générales</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Nom</Label>
            <Input id="name" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
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
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" required value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="categoryId">Catégorie</Label>
            <Select id="categoryId" required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Choisir…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="brandId">Marque</Label>
            <Select id="brandId" required value={form.brandId} onChange={(e) => set("brandId", e.target.value)}>
              <option value="">Choisir…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="shortDescription">Description courte</Label>
          <Input id="shortDescription" value={form.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} />
        </div>
        <div className="mt-4">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" required rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">Prix &amp; stock</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="price">Prix (€ TTC)</Label>
            <Input id="price" type="number" step="0.01" required value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="compareAtPrice">Prix promotionnel barré (€)</Label>
            <Input
              id="compareAtPrice"
              type="number"
              step="0.01"
              value={form.compareAtPrice ?? ""}
              onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <Label htmlFor="taxRate">TVA (%)</Label>
            <Input id="taxRate" type="number" step="0.1" value={form.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" type="number" value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="lowStockThreshold">Seuil d&apos;alerte</Label>
            <Input id="lowStockThreshold" type="number" value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">Mise en avant</p>
        <div className="flex flex-wrap gap-5">
          {(["isActive", "isFeatured", "isNew", "isBestSeller"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-accent" />
              {key === "isActive" ? "Actif (visible sur le site)" : key === "isFeatured" ? "Mis en avant" : key === "isNew" ? "Nouveau" : "Meilleure vente"}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-1 font-medium text-ink">Images</p>
        <p className="mb-3 text-xs text-muted">Une URL d&apos;image par ligne.</p>
        <Textarea rows={4} value={form.imagesText} onChange={(e) => set("imagesText", e.target.value)} placeholder="https://…" />
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-1 font-medium text-ink">Caractéristiques techniques</p>
        <p className="mb-3 text-xs text-muted">Une caractéristique par ligne, au format « Nom: valeur1, valeur2 ».</p>
        <Textarea rows={4} value={form.attributesText} onChange={(e) => set("attributesText", e.target.value)} placeholder="Puissance: 18V" />
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-1 font-medium text-ink">Variantes</p>
        <p className="mb-3 text-xs text-muted">Une variante par ligne, au format « Nom | SKU | supplément prix | stock ».</p>
        <Textarea rows={4} value={form.variantsText} onChange={(e) => set("variantsText", e.target.value)} placeholder="Rouge | ABC-RED | 0 | 10" />
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-4 font-medium text-ink">SEO</p>
        <div>
          <Label htmlFor="seoTitle">Titre SEO</Label>
          <Input id="seoTitle" value={form.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} />
        </div>
        <div className="mt-4">
          <Label htmlFor="seoDescription">Description SEO</Label>
          <Textarea id="seoDescription" rows={2} value={form.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} />
        </div>
      </section>

      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Enregistrement…" : productId ? "Mettre à jour le produit" : "Créer le produit"}
      </Button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createTutorialAction, updateTutorialAction, type TutorialFormInput } from "@/server/actions/admin/tutorial.actions";

type Category = { id: string; name: string };

const EMPTY: TutorialFormInput = {
  title: "",
  slug: "",
  description: "",
  content: "",
  thumbnailUrl: "",
  videoUrl: "",
  durationMinutes: 5,
  level: "BEGINNER",
  categoryId: "",
  tagsText: "",
  productIdsText: "",
  isPublished: true,
};

export function TutorialForm({
  categories,
  tutorialId,
  initial,
}: {
  categories: Category[];
  tutorialId?: string;
  initial?: Partial<TutorialFormInput>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<TutorialFormInput>({ ...EMPTY, ...initial });
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));

  function set<K extends keyof TutorialFormInput>(key: K, value: TutorialFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = tutorialId ? await updateTutorialAction(tutorialId, form) : await createTutorialAction(form);
      if (!result.success) return toast(result.error, "error");
      toast(tutorialId ? "Tutoriel mis à jour." : "Tutoriel créé.", "success");
      router.push("/admin/tutorials");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Label>Titre</Label>
        <Input
          required
          value={form.title}
          onChange={(e) => {
            set("title", e.target.value);
            if (!slugEdited) set("slug", slugify(e.target.value, { lower: true, strict: true, locale: "fr" }));
          }}
        />
      </div>
      <div>
        <Label>Slug</Label>
        <Input required value={form.slug} onChange={(e) => { setSlugEdited(true); set("slug", e.target.value); }} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea required rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div>
        <Label>Contenu (étapes)</Label>
        <Textarea required rows={6} value={form.content} onChange={(e) => set("content", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Miniature (URL)</Label>
          <Input value={form.thumbnailUrl} onChange={(e) => set("thumbnailUrl", e.target.value)} />
        </div>
        <div>
          <Label>Vidéo (URL)</Label>
          <Input required value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} />
        </div>
        <div>
          <Label>Durée (minutes)</Label>
          <Input type="number" required value={form.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} />
        </div>
        <div>
          <Label>Niveau</Label>
          <Select value={form.level} onChange={(e) => set("level", e.target.value as TutorialFormInput["level"])}>
            <option value="BEGINNER">Débutant</option>
            <option value="INTERMEDIATE">Intermédiaire</option>
            <option value="ADVANCED">Avancé</option>
          </Select>
        </div>
        <div>
          <Label>Catégorie</Label>
          <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">Aucune</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label>Tags (séparés par des virgules)</Label>
        <Input value={form.tagsText} onChange={(e) => set("tagsText", e.target.value)} placeholder="bricolage, diy, débutant" />
      </div>
      <div>
        <Label>IDs des produits associés (un par ligne, voir la fiche produit)</Label>
        <Textarea rows={3} value={form.productIdsText} onChange={(e) => set("productIdsText", e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="h-4 w-4 accent-accent" />
        Publié
      </label>
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Enregistrement…" : tutorialId ? "Mettre à jour" : "Créer le tutoriel"}
      </Button>
    </form>
  );
}

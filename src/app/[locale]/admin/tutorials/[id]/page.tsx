import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getAdminTutorialById } from "@/server/queries/admin.queries";
import { TutorialForm } from "@/components/admin/tutorial-form";

export const metadata: Metadata = { title: "Modifier le tutoriel — Admin" };

export default async function EditTutorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("Admin.Tutorials");
  const [tutorial, categories] = await Promise.all([
    getAdminTutorialById(id),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!tutorial) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("editTitle", { title: tutorial.title })}</h1>
      <div className="mt-6">
        <TutorialForm
          tutorialId={tutorial.id}
          categories={categories}
          initial={{
            title: tutorial.title,
            slug: tutorial.slug,
            description: tutorial.description,
            content: tutorial.content,
            thumbnailUrl: tutorial.thumbnailUrl ?? "",
            videoUrl: tutorial.videoUrl,
            durationMinutes: tutorial.durationMinutes,
            level: tutorial.level,
            categoryId: tutorial.categoryId ?? "",
            tagsText: tutorial.tags.join(", "),
            productIdsText: tutorial.products.map((tp) => tp.product.id).join("\n"),
            isPublished: tutorial.isPublished,
          }}
        />
      </div>
      {tutorial.products.length > 0 && (
        <div className="mt-6 rounded-md border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-medium text-ink">{t("linkedProductsNote")}</p>
          <ul className="flex flex-col gap-1 text-sm text-muted">
            {tutorial.products.map((tp) => (
              <li key={tp.product.id}>{tp.product.id} — {tp.product.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

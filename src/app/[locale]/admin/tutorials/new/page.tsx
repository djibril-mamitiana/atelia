import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { TutorialForm } from "@/components/admin/tutorial-form";

export const metadata: Metadata = { title: "Nouveau tutoriel — Admin" };

export default async function NewTutorialPage() {
  const t = await getTranslations("Admin.Tutorials");
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("newTitle")}</h1>
      <div className="mt-6">
        <TutorialForm categories={categories} />
      </div>
    </div>
  );
}

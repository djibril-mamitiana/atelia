import { adminTitle } from "@/lib/admin-metadata";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { localizedCategoryName } from "@/lib/category-name";
import { TutorialForm } from "@/components/admin/tutorial-form";

export const generateMetadata = () => adminTitle("navTutorials");

export default async function NewTutorialPage() {
  const t = await getTranslations("Admin.Tutorials");
  const locale = await getLocale();
  const categoryRows = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, nameDe: true, nameEn: true, nameIt: true } });
  // Dropdown option labels only (the value stays the id) — safe to localize.
  const categories = categoryRows.map((c) => ({ id: c.id, name: localizedCategoryName(c, locale) }));

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("newTitle")}</h1>
      <div className="mt-6">
        <TutorialForm categories={categories} />
      </div>
    </div>
  );
}

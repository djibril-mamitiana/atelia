import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCategoryTree } from "@/server/queries/categories.queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Catalog");
  return { title: t("categoriesTitle") };
}

export default async function CategoriesPage() {
  const categories = await getCategoryTree();
  const t = await getTranslations("Catalog");

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">{t("categoriesTitle")}</h1>
      <p className="mt-1.5 text-sm text-muted">{t("categoriesSubtitle")}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.id} className="overflow-hidden rounded-md border border-border">
            <Link href={`/categories/${cat.slug}`} className="relative block aspect-[16/9] bg-paper">
              {cat.imageUrl && (
                <Image src={cat.imageUrl} alt={cat.name} fill sizes="33vw" className="object-cover" />
              )}
            </Link>
            <div className="p-4">
              <Link href={`/categories/${cat.slug}`} className="font-display text-lg text-ink hover:text-accent-dark">
                {cat.name}
              </Link>
              {cat.children.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/categories/${child.slug}`} className="text-sm text-muted hover:text-accent-dark">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { getAdminTutorials } from "@/server/queries/admin.queries";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Tutoriels — Admin" };

export default async function AdminTutorialsPage() {
  const t = await getTranslations("Admin.Tutorials");
  const tutorials = await getAdminTutorials();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">{t("title")}</h1>
        <LinkButton href="/admin/tutorials/new" size="sm"><Plus size={15} /> {t("newTutorial")}</LinkButton>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("colTitle")}</th>
              <th className="px-4 py-3">{t("colCategory")}</th>
              <th className="px-4 py-3">{t("colLinkedProducts")}</th>
              <th className="px-4 py-3">{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tutorials.map((tut) => (
              <tr key={tut.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/admin/tutorials/${tut.id}`} className="font-medium text-ink hover:text-accent-dark">{tut.title}</Link>
                </td>
                <td className="px-4 py-3 text-muted">{tut.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{tut._count.products}</td>
                <td className="px-4 py-3"><Badge tone={tut.isPublished ? "sage" : "neutral"}>{tut.isPublished ? t("published") : t("draft")}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

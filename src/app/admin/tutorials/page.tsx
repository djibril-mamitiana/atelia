import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getAdminTutorials } from "@/server/queries/admin.queries";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Tutoriels — Admin" };

export default async function AdminTutorialsPage() {
  const tutorials = await getAdminTutorials();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Tutoriels</h1>
        <LinkButton href="/admin/tutorials/new" size="sm"><Plus size={15} /> Nouveau tutoriel</LinkButton>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Produits liés</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tutorials.map((t) => (
              <tr key={t.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/admin/tutorials/${t.id}`} className="font-medium text-ink hover:text-accent-dark">{t.title}</Link>
                </td>
                <td className="px-4 py-3 text-muted">{t.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{t._count.products}</td>
                <td className="px-4 py-3"><Badge tone={t.isPublished ? "sage" : "neutral"}>{t.isPublished ? "Publié" : "Brouillon"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

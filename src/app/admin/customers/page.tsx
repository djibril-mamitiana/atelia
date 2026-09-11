import Link from "next/link";
import type { Metadata } from "next";
import { getAdminCustomers } from "@/server/queries/admin.queries";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { Pagination } from "@/components/catalog/pagination";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Clients — Admin" };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  const { customers, total, pageCount } = await getAdminCustomers({ q, page: page ? Number(page) : 1 });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Clients ({total})</h1>
      <div className="mt-4">
        <AdminSearchBar placeholder="Nom ou email…" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Commandes</th>
              <th className="px-4 py-3">Total dépensé</th>
              <th className="px-4 py-3">Dernière commande</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="font-medium text-ink hover:text-accent-dark">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{c.email}</td>
                <td className="px-4 py-3 text-ink">{c.orderCount}</td>
                <td className="px-4 py-3 text-ink">{formatPrice(c.totalSpent)}</td>
                <td className="px-4 py-3 text-muted">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}</td>
                <td className="px-4 py-3"><Badge tone={c.isActive ? "sage" : "neutral"}>{c.isActive ? "Actif" : "Inactif"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page ? Number(page) : 1} pageCount={pageCount} basePath="/admin/customers" searchParams={{ q }} />
    </div>
  );
}

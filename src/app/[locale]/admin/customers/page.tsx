import { adminTitle } from "@/lib/admin-metadata";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { getAdminCustomers } from "@/server/queries/admin.queries";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { Pagination } from "@/components/catalog/pagination";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/format";

export const generateMetadata = () => adminTitle("navCustomers");

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const t = await getTranslations("Admin.Customers");
  const locale = await getLocale();
  const { q, page } = await searchParams;
  const { customers, total, pageCount } = await getAdminCustomers({ q, page: page ? Number(page) : 1 });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">{t("title", { count: total })}</h1>
        <LinkButton href="/admin/customers/new" size="sm">
          <Plus size={16} /> {t("newCustomer")}
        </LinkButton>
      </div>
      <div className="mt-4">
        <AdminSearchBar placeholder={t("searchPlaceholder")} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("colName")}</th>
              <th className="px-4 py-3">{t("colCompany")}</th>
              <th className="px-4 py-3">{t("colEmail")}</th>
              <th className="px-4 py-3">{t("colCode")}</th>
              <th className="px-4 py-3">{t("colOrders")}</th>
              <th className="px-4 py-3">{t("colTotalSpent")}</th>
              <th className="px-4 py-3">{t("colLastOrder")}</th>
              <th className="px-4 py-3">{t("colStatus")}</th>
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
                <td className="px-4 py-3 text-ink-soft">{c.company ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{c.email}</td>
                <td className="px-4 py-3">
                  {c.customerCode ? (
                    <span className="font-mono text-xs tracking-wider text-ink">{c.customerCode}</span>
                  ) : (
                    // Accounts from before codes existed can't sign in until given one.
                    <Badge tone="danger">{t("noCode")}</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-ink">{c.orderCount}</td>
                <td className="px-4 py-3 text-ink">{formatPrice(c.totalSpent, locale)}</td>
                <td className="px-4 py-3 text-muted">{c.lastOrderAt ? formatDate(c.lastOrderAt, locale) : "—"}</td>
                <td className="px-4 py-3"><Badge tone={c.isActive ? "sage" : "neutral"}>{c.isActive ? t("active") : t("inactive")}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page ? Number(page) : 1} pageCount={pageCount} basePath="/admin/customers" searchParams={{ q }} />
    </div>
  );
}

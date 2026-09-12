import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getUserOrders } from "@/server/queries/orders.queries";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Pagination } from "@/components/catalog/pagination";
import { formatDate, formatPrice } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("ordersTitle") };
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireUser("/compte/commandes");
  const { page } = await searchParams;
  const { orders, pageCount } = await getUserOrders(session.userId, page ? Number(page) : 1);
  const t = await getTranslations("Account");
  const tOrder = await getTranslations("Order");
  const tCart = await getTranslations("Cart");

  const STATUS_LABELS: Record<string, string> = {
    PENDING: tOrder("statusPending"),
    CONFIRMED: tOrder("statusConfirmed"),
    PROCESSING: tOrder("statusProcessing"),
    SHIPPED: tOrder("statusShipped"),
    OUT_FOR_DELIVERY: tOrder("statusOutForDelivery"),
    DELIVERED: tOrder("statusDelivered"),
    CANCELLED: tOrder("statusCancelled"),
    REFUNDED: tOrder("statusRefunded"),
  };

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={t("noOrdersTitle")}
        description={t("noOrdersDescription")}
        action={<LinkButton href="/produits" className="mt-2">{tCart("discoverProducts")}</LinkButton>}
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("ordersTitle")}</h1>

      <div className="mt-6 flex flex-col divide-y divide-border rounded-md border border-border">
        {orders.map((order) => (
          <Link key={order.id} href={`/compte/commandes/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-paper">
            <div>
              <p className="text-sm font-medium text-ink">{order.orderNumber}</p>
              <p className="text-xs text-muted">{formatDate(order.createdAt)} · {t("itemsCount", { count: order.items.length })}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-ink">{formatPrice(Number(order.total))}</span>
              <Badge tone={order.status === "DELIVERED" ? "sage" : order.status === "CANCELLED" || order.status === "REFUNDED" ? "danger" : "accent"}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </div>
          </Link>
        ))}
      </div>

      <Pagination page={page ? Number(page) : 1} pageCount={pageCount} basePath="/compte/commandes" searchParams={{}} />
    </div>
  );
}

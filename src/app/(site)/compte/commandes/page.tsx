import Link from "next/link";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getUserOrders } from "@/server/queries/orders.queries";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Pagination } from "@/components/catalog/pagination";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Mes commandes" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de paiement",
  CONFIRMED: "Confirmée",
  PROCESSING: "En préparation",
  SHIPPED: "Expédiée",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireUser("/compte/commandes");
  const { page } = await searchParams;
  const { orders, pageCount } = await getUserOrders(session.userId, page ? Number(page) : 1);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aucune commande pour le moment"
        description="Vos commandes apparaîtront ici une fois votre premier achat effectué."
        action={<LinkButton href="/produits" className="mt-2">Découvrir les produits</LinkButton>}
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Mes commandes</h1>

      <div className="mt-6 flex flex-col divide-y divide-border rounded-md border border-border">
        {orders.map((order) => (
          <Link key={order.id} href={`/compte/commandes/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-paper">
            <div>
              <p className="text-sm font-medium text-ink">{order.orderNumber}</p>
              <p className="text-xs text-muted">{formatDate(order.createdAt)} · {order.items.length} article{order.items.length > 1 ? "s" : ""}</p>
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

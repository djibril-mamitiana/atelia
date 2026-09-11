import Image from "next/image";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OrderStatusTimeline } from "@/components/order/order-status-timeline";
import { formatDate, formatPrice } from "@/lib/format";
import { getBankTransferDetails } from "@/lib/bank";
import type { getOrderForUser } from "@/server/queries/orders.queries";

type Order = NonNullable<Awaited<ReturnType<typeof getOrderForUser>>>;

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

const STATUS_TONE: Record<string, "accent" | "sage" | "danger" | "neutral"> = {
  PENDING: "neutral",
  CONFIRMED: "accent",
  PROCESSING: "accent",
  SHIPPED: "sage",
  OUT_FOR_DELIVERY: "sage",
  DELIVERED: "sage",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

export function OrderDetail({ order }: { order: Order }) {
  const paymentPending = order.payment?.provider === "BANK_TRANSFER" && order.payment.status === "PENDING";
  const bank = paymentPending ? getBankTransferDetails() : null;

  return (
    <div>
      {order.status === "PENDING" && paymentPending && (
        <div className="mb-6 rounded-md bg-sage-soft px-4 py-3 text-sm text-sage">
          Merci pour votre commande ! Elle sera préparée dès réception de votre virement.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Commande</p>
          <h1 className="font-display text-2xl text-ink">{order.orderNumber}</h1>
          <p className="text-sm text-muted">Passée le {formatDate(order.createdAt)}</p>
        </div>
        <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABELS[order.status]}</Badge>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          {bank && (
            <section className="rounded-md border border-accent/30 bg-accent-soft p-5">
              <div className="mb-3 flex items-center gap-2">
                <Landmark size={18} className="text-accent-dark" />
                <h2 className="font-display text-lg text-ink">Coordonnées bancaires pour votre virement</h2>
              </div>
              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-ink-soft">Bénéficiaire</dt><dd className="font-medium text-ink">{bank.holder}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-soft">Banque</dt><dd className="font-medium text-ink">{bank.bankName}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-soft">IBAN</dt><dd className="font-medium text-ink">{bank.iban}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-soft">BIC</dt><dd className="font-medium text-ink">{bank.bic}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-soft">Montant</dt><dd className="font-medium text-ink">{formatPrice(Number(order.total))}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-soft">Référence à indiquer</dt><dd className="font-medium text-ink">{order.orderNumber}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-ink-soft">
                Merci d&apos;indiquer la référence <strong>{order.orderNumber}</strong> dans le libellé de votre
                virement — votre commande sera préparée dès réception des fonds.
              </p>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-lg text-ink">Suivi de commande</h2>
            <OrderStatusTimeline currentStatus={order.status} history={order.statusHistory} />
            {order.shipment?.trackingNumber && (
              <p className="mt-2 text-sm text-muted">
                Transporteur : {order.shipment.carrier} — N° de suivi : <span className="font-medium text-ink">{order.shipment.trackingNumber}</span>
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg text-ink">Produits</h2>
            <div className="flex flex-col divide-y divide-border rounded-md border border-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3.5">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-paper">
                    {item.product.images[0] && (
                      <Image src={item.product.images[0].url} alt="" fill sizes="56px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/produits/${item.product.slug}`} className="truncate text-sm text-ink hover:text-accent-dark">
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted">Qté {item.quantity} · {formatPrice(Number(item.unitPrice))}</p>
                  </div>
                  <span className="text-sm font-medium text-ink">{formatPrice(Number(item.total))}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-border p-5">
            <p className="mb-3 font-medium text-ink">Montant</p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd>{formatPrice(Number(order.subtotal))}</dd></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sage"><dt>Réduction</dt><dd>-{formatPrice(Number(order.discount))}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted">Livraison</dt><dd>{Number(order.shippingCost) === 0 ? "Offerte" : formatPrice(Number(order.shippingCost))}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-ink"><dt>Total</dt><dd>{formatPrice(Number(order.total))}</dd></div>
            </dl>
            {order.payment && (
              <p className="mt-3 text-xs text-muted">
                Paiement : {order.payment.status === "PAID" ? "Virement reçu" : order.payment.status === "PENDING" ? "En attente de virement" : order.payment.status}
              </p>
            )}
          </div>

          <div className="rounded-md border border-border p-5">
            <p className="mb-2 font-medium text-ink">Adresse de livraison</p>
            <p className="text-sm text-muted">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
              {order.shippingAddress.line1}<br />
              {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getOrderForUser } from "@/server/queries/orders.queries";
import { OrderDetail } from "@/components/order/order-detail";

export const metadata: Metadata = { title: "Détail de la commande" };

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser(`/compte/commandes/${id}`);

  const order = await getOrderForUser(id, session.userId);
  if (!order) notFound();

  return <OrderDetail order={order} />;
}

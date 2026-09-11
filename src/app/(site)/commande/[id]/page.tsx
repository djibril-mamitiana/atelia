import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getOrderForUser } from "@/server/queries/orders.queries";
import { OrderDetail } from "@/components/order/order-detail";

export const metadata: Metadata = { title: "Confirmation de commande" };

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser(`/commande/${id}`);

  const order = await getOrderForUser(id, session.userId);
  if (!order) notFound();

  return (
    <div className="container-page py-10">
      <OrderDetail order={order} />
    </div>
  );
}

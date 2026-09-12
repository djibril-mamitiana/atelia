import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { getOrderForUser } from "@/server/queries/orders.queries";
import { OrderDetail } from "@/components/order/order-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Order");
  return { title: t("confirmationTitle") };
}

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

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { applyInventoryMovement } from "@/server/services/inventory";

// Stripe requires the raw request body (untouched by any body parser) to
// verify the webhook signature — Route Handlers give us that via .text().
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await markOrderPaid(session);
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await markOrderFailed(session);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function markOrderPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await db.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order || order.payment?.status === "PAID") return; // idempotent

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      },
    });
    await tx.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "CONFIRMED", comment: "Paiement confirmé." },
    });
    await tx.shipment.upsert({
      where: { orderId },
      create: { orderId, status: "PREPARING" },
      update: {},
    });
  });
}

async function markOrderFailed(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });
  if (!order || order.status === "CANCELLED" || order.payment?.status === "PAID") return;

  await db.$transaction(async (tx) => {
    await tx.payment.update({ where: { orderId }, data: { status: "FAILED" } });
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "CANCELLED", comment: "Paiement échoué ou expiré — commande annulée." },
    });
    for (const item of order.items) {
      await applyInventoryMovement(tx, {
        productId: item.productId,
        variantId: item.variantId,
        type: "RETURN",
        quantity: item.quantity,
        reason: `Annulation ${order.orderNumber}`,
      });
    }
  });
}

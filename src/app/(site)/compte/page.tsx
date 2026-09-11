import Link from "next/link";
import type { Metadata } from "next";
import { Package, Truck, Heart, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountHomePage() {
  const session = await requireUser("/compte");

  const [ordersCount, ongoingCount, favoritesCount, addressesCount] = await Promise.all([
    db.order.count({ where: { userId: session.userId } }),
    db.order.count({
      where: { userId: session.userId, status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"] } },
    }),
    db.favorite.count({ where: { userId: session.userId } }),
    db.address.count({ where: { userId: session.userId } }),
  ]);

  const cards = [
    { href: "/compte/commandes", icon: Package, label: "Commandes", value: ordersCount },
    { href: "/compte/commandes", icon: Truck, label: "Commandes en cours", value: ongoingCount },
    { href: "/compte/favoris", icon: Heart, label: "Favoris", value: favoritesCount },
    { href: "/compte/adresses", icon: MapPin, label: "Adresses", value: addressesCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className="rounded-md border border-border p-5 hover:border-border-strong">
          <card.icon size={20} className="text-accent" strokeWidth={1.6} />
          <p className="mt-3 text-2xl font-semibold text-ink">{card.value}</p>
          <p className="text-sm text-muted">{card.label}</p>
        </Link>
      ))}
    </div>
  );
}

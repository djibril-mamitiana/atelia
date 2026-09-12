import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Package, Truck, Heart, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("navOverview") };
}

export default async function AccountHomePage() {
  const session = await requireUser("/compte");
  const t = await getTranslations("Account");

  const [ordersCount, ongoingCount, favoritesCount, addressesCount] = await Promise.all([
    db.order.count({ where: { userId: session.userId } }),
    db.order.count({
      where: { userId: session.userId, status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"] } },
    }),
    db.favorite.count({ where: { userId: session.userId } }),
    db.address.count({ where: { userId: session.userId } }),
  ]);

  const cards = [
    { href: "/compte/commandes", icon: Package, label: t("overviewOrders"), value: ordersCount },
    { href: "/compte/commandes", icon: Truck, label: t("overviewOngoingOrders"), value: ongoingCount },
    { href: "/compte/favoris", icon: Heart, label: t("overviewFavorites"), value: favoritesCount },
    { href: "/compte/adresses", icon: MapPin, label: t("overviewAddresses"), value: addressesCount },
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

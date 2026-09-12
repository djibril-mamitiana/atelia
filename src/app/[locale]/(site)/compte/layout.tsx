import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { User, Package, MapPin, Heart, Bell } from "lucide-react";
import { requireUser } from "@/lib/auth/session";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await requireUser("/compte");
  const t = await getTranslations("Account");

  const NAV = [
    { href: "/compte", label: t("navOverview"), icon: User },
    { href: "/compte/commandes", label: t("navOrders"), icon: Package },
    { href: "/compte/adresses", label: t("navAddresses"), icon: MapPin },
    { href: "/compte/favoris", label: t("navFavorites"), icon: Heart },
    { href: "/compte/profil", label: t("navProfile"), icon: Bell },
  ];

  return (
    <div className="container-page py-10">
      <p className="font-display text-2xl text-ink">{t("greeting", { name: session.firstName })}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}

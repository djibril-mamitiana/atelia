import type { ReactNode } from "react";
import Link from "next/link";
import { User, Package, MapPin, Heart, Bell } from "lucide-react";
import { requireUser } from "@/lib/auth/session";

const NAV = [
  { href: "/compte", label: "Vue d'ensemble", icon: User },
  { href: "/compte/commandes", label: "Commandes", icon: Package },
  { href: "/compte/adresses", label: "Adresses", icon: MapPin },
  { href: "/compte/favoris", label: "Favoris", icon: Heart },
  { href: "/compte/profil", label: "Profil & sécurité", icon: Bell },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await requireUser("/compte");

  return (
    <div className="container-page py-10">
      <p className="font-display text-2xl text-ink">Bonjour {session.firstName}</p>

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

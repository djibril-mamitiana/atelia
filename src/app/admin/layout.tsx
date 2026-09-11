import type { ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  Boxes,
  ShoppingBag,
  Users,
  Percent,
  Star,
  PlayCircle,
  BarChart3,
  Settings,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { SITE_NAME } from "@/lib/constants";
import { LogoutMenuItem } from "@/components/admin/logout-menu-item";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produits", icon: Package },
  { href: "/admin/categories", label: "Catégories", icon: FolderTree },
  { href: "/admin/brands", label: "Marques", icon: Tag },
  { href: "/admin/inventory", label: "Stocks", icon: Boxes },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingBag },
  { href: "/admin/customers", label: "Clients", icon: Users },
  { href: "/admin/promotions", label: "Promotions", icon: Percent },
  { href: "/admin/reviews", label: "Avis", icon: Star },
  { href: "/admin/tutorials", label: "Tutoriels", icon: PlayCircle },
  { href: "/admin/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["ADMIN", "STAFF"], "/admin");

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border px-5 py-5">
          <p className="font-display text-lg text-ink">{SITE_NAME}</p>
          <p className="text-xs text-muted">Back-office</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink">
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <p className="px-3 py-1 text-xs text-muted">{session.firstName} · {session.role}</p>
          <LogoutMenuItem />
        </div>
      </aside>

      <div className="flex-1">
        <div className="border-b border-border bg-surface px-4 py-3 lg:hidden">
          <p className="font-display text-lg text-ink">{SITE_NAME} — Back-office</p>
        </div>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

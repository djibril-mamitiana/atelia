import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["ADMIN", "STAFF"], "/admin");
  const t = await getTranslations("Admin");

  const NAV = [
    { href: "/admin", label: t("navDashboard"), icon: LayoutDashboard },
    { href: "/admin/products", label: t("navProducts"), icon: Package },
    { href: "/admin/categories", label: t("navCategories"), icon: FolderTree },
    { href: "/admin/brands", label: t("navBrands"), icon: Tag },
    { href: "/admin/inventory", label: t("navInventory"), icon: Boxes },
    { href: "/admin/orders", label: t("navOrders"), icon: ShoppingBag },
    { href: "/admin/customers", label: t("navCustomers"), icon: Users },
    { href: "/admin/promotions", label: t("navPromotions"), icon: Percent },
    { href: "/admin/reviews", label: t("navReviews"), icon: Star },
    { href: "/admin/tutorials", label: t("navTutorials"), icon: PlayCircle },
    { href: "/admin/analytics", label: t("navAnalytics"), icon: BarChart3 },
    { href: "/admin/settings", label: t("navSettings"), icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <div>
            <p className="font-display text-lg text-ink">{SITE_NAME}</p>
            <p className="text-xs text-muted">{t("backoffice")}</p>
          </div>
          <LanguageSwitcher variant="light" />
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

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
          <p className="font-display text-lg text-ink">{SITE_NAME} — {t("backoffice")}</p>
          <LanguageSwitcher variant="light" />
        </div>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

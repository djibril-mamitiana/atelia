import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Truck, ShieldCheck, RotateCcw, Headset } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export async function Footer() {
  const t = await getTranslations("Footer");

  const reassurance = [
    { icon: Truck, title: t("reassurance.shippingTitle"), description: t("reassurance.shippingDescription") },
    { icon: ShieldCheck, title: t("reassurance.paymentTitle"), description: t("reassurance.paymentDescription") },
    { icon: RotateCcw, title: t("reassurance.returnsTitle"), description: t("reassurance.returnsDescription") },
    { icon: Headset, title: t("reassurance.supportTitle"), description: t("reassurance.supportDescription") },
  ];

  const columns = [
    {
      title: t("shopTitle"),
      links: [
        { href: "/produits", label: t("catalog") },
        { href: "/categories", label: t("categories") },
        { href: "/produits?promotion=1", label: t("promotions") },
        { href: "/tutoriels", label: t("tutorials") },
      ],
    },
    {
      title: t("accountTitle"),
      links: [
        { href: "/compte", label: t("myAccount") },
        { href: "/compte/commandes", label: t("trackOrder") },
        { href: "/compte/favoris", label: t("myFavorites") },
        { href: "/connexion", label: t("login") },
      ],
    },
    {
      title: t("helpTitle"),
      links: [
        { href: "/faq", label: t("faq") },
        { href: "/contact", label: t("contact") },
        { href: "/faq#livraison", label: t("shippingHelp") },
        { href: "/faq#retours", label: t("returnsHelp") },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
        {reassurance.map((item) => (
          <div key={item.title} className="flex flex-col gap-2">
            <item.icon size={22} className="text-accent" strokeWidth={1.6} />
            <p className="text-sm font-medium text-ink">{item.title}</p>
            <p className="text-xs text-muted">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl text-ink">{SITE_NAME}</p>
            <p className="mt-3 max-w-xs text-sm text-muted">{t("description")}</p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium text-ink">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE_NAME}. {t("copyright")}</p>
          <div className="flex gap-4">
            <Link href="/faq" className="hover:text-ink">
              {t("legal")}
            </Link>
            <Link href="/faq" className="hover:text-ink">
              {t("terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

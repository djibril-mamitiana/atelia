import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Truck, ShieldCheck, RotateCcw, Headset, ArrowUpRight } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";

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
    <footer className="relative overflow-hidden bg-graphite text-white">
      <div className="border-b border-white/10">
        <div className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
          {reassurance.map((item) => (
            <div key={item.title} className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-accent">
                <item.icon size={18} strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-[13px] leading-snug text-steel">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-14 pb-10 pt-16 lg:grid-cols-[1.4fr_2fr] lg:gap-20 lg:pt-20">
        <div>
          <Logo tone="light" />
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-steel">{t("description")}</p>
          <Link
            href="/contact"
            className="group mt-8 inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white hover:text-graphite"
          >
            {t("contact")}
            <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow text-steel">{col.title}</p>
              <ul className="mt-5 flex flex-col gap-3.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="link-underline text-[15px] text-white/85 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none select-none px-2 text-center font-display leading-[0.8] tracking-[-0.04em] text-white/[0.045] [font-size:clamp(5rem,26vw,25rem)]">
        {SITE_NAME}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-[13px] text-steel sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. {t("copyright")}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/faq" className="transition-colors hover:text-white">
              {t("legal")}
            </Link>
            <Link href="/faq" className="transition-colors hover:text-white">
              {t("terms")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
  _count: { products: number };
};

export function MobileNav({ categories, loggedIn }: { categories: CategoryNode[]; loggedIn: boolean }) {
  const t = useTranslations("MobileNav");
  const tHeader = useTranslations("Header");
  const tUser = useTranslations("UserMenu");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const families = categories
    .flatMap((root) => (root.children.length > 0 ? root.children : [root]))
    .filter((c) => c._count.products > 0)
    .sort((a, b) => b._count.products - a._count.products);

  const secondary = "flex items-center justify-between border-b border-border py-4 text-lg text-ink";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
        className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 lg:hidden"
      >
        <Menu size={22} strokeWidth={1.7} />
      </button>

      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-graphite/55 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[92%] max-w-[420px] flex-col bg-paper shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <Logo />
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="light" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("closeMenu")}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink/5"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 pb-8">
            <p className="eyebrow mb-1 mt-4 text-muted">{tHeader("catalog")}</p>
            <ul>
              {families.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.slug}`} className="flex items-center justify-between gap-4 border-b border-border py-3.5 text-[15px] text-ink">
                    <span>{cat.name}</span>
                    <ArrowUpRight size={15} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/produits"
              className="mt-5 flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-sm font-medium text-graphite"
            >
              {tHeader("viewCatalog")} <ArrowUpRight size={16} />
            </Link>

            <div className="mt-8">
              <Link href="/produits?promotion=1" className={secondary}>
                {t("promotions")}
              </Link>
              <Link href="/tutoriels" className={secondary}>
                {tHeader("guides")}
              </Link>
              <Link href={loggedIn ? "/compte" : "/connexion"} className={secondary}>
                {loggedIn ? tUser("myAccount") : tUser("login")}
              </Link>
              <Link href="/compte/favoris" className={secondary}>
                {tHeader("favorites")}
              </Link>
              <Link href="/faq" className={secondary}>
                {t("faq")}
              </Link>
              <Link href="/contact" className={secondary}>
                {t("contact")}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}

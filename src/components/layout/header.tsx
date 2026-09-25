import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getCurrentCart, cartItemCount } from "@/server/services/cart";
import { getCategoryTree } from "@/server/queries/categories.queries";
import { SearchBar } from "@/components/layout/search-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileSearch } from "@/components/layout/mobile-search";
import { UserMenu } from "@/components/layout/user-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { CatalogMenu } from "@/components/layout/catalog-menu";
import { HeaderShell } from "@/components/layout/header-shell";
import { Logo } from "@/components/layout/logo";

export async function Header() {
  const [session, cart, categories, t] = await Promise.all([
    getSession(),
    getCurrentCart(),
    getCategoryTree(),
    getTranslations("Header"),
  ]);
  const count = cartItemCount(cart);

  // The tree has a single root ("Outils diamant") holding the real families;
  // the menu lists the families that actually contain products.
  const families = categories
    .flatMap((root) => (root.children.length > 0 ? root.children : [root]))
    .filter((c) => c._count.products > 0)
    .sort((a, b) => b._count.products - a._count.products)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: c._count.products }));

  const navLink =
    "flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink transition-colors hover:bg-ink/5";

  return (
    <>
      <div className="hidden bg-graphite text-[12.5px] text-steel lg:block">
        <div className="container-page flex h-9 items-center justify-between">
          <p className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t("announcement")}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/faq" className="transition-colors hover:text-white">
              {t("help")}
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white">
              {t("contact")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <HeaderShell>
        <div className="container-page relative flex h-16 items-center gap-2 lg:h-[76px] lg:gap-6">
          <MobileNav categories={categories} loggedIn={Boolean(session)} />

          <Logo className="max-lg:mr-auto" />

          <nav className="hidden h-full items-center gap-1 lg:flex" aria-label="Principal">
            <CatalogMenu items={families} />
            <Link href="/produits?promotion=1" className={navLink}>
              {t("promotions")}
            </Link>
            <Link href="/tutoriels" className={navLink}>
              {t("guides")}
            </Link>
          </nav>

          <div className="ml-auto hidden w-full max-w-[300px] lg:block xl:max-w-[340px]">
            <SearchBar />
          </div>

          <div className="flex items-center gap-0.5">
            <MobileSearch />
            <div className="max-sm:hidden">
              <UserMenu session={session ? { firstName: session.firstName, role: session.role } : null} />
            </div>

            <Link
              href="/compte/favoris"
              aria-label={t("favorites")}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 sm:flex"
            >
              <Heart size={20} strokeWidth={1.7} />
            </Link>

            <Link
              href="/panier"
              aria-label={t("cart")}
              className="relative flex h-10 items-center gap-2 rounded-full px-3 text-ink transition-colors hover:bg-ink/5"
            >
              <ShoppingBag size={20} strokeWidth={1.7} />
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-mono text-[10.5px] font-semibold text-graphite">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </HeaderShell>
    </>
  );
}

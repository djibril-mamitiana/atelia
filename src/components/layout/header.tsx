import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getCurrentCart, cartItemCount } from "@/server/services/cart";
import { getCategoryTree } from "@/server/queries/categories.queries";
import { SearchBar } from "@/components/layout/search-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { SITE_NAME } from "@/lib/constants";

export async function Header() {
  const [session, cart, categories] = await Promise.all([getSession(), getCurrentCart(), getCategoryTree()]);
  const count = cartItemCount(cart);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="hidden border-b border-border bg-ink text-paper/90 lg:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <p>Livraison offerte dès 49 € d&apos;achat · Retrait en magasin gratuit</p>
          <div className="flex gap-5">
            <Link href="/tutoriels" className="hover:text-white">
              Tutoriels &amp; conseils
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-3 lg:h-20 lg:gap-6">
        <MobileNav categories={categories} />

        <Link href="/" className="font-display text-2xl tracking-tight text-ink shrink-0">
          {SITE_NAME}
        </Link>

        <SearchBar className="hidden max-w-xl flex-1 lg:block" />

        <div className="ml-auto flex items-center gap-5 lg:gap-6">
          <UserMenu session={session ? { firstName: session.firstName, role: session.role } : null} />

          <Link href="/compte/favoris" className="hidden flex-col items-center gap-0.5 text-ink-soft hover:text-ink sm:flex">
            <Heart size={20} strokeWidth={1.6} />
            <span className="hidden text-[11px] lg:block">Favoris</span>
          </Link>

          <Link href="/panier" className="relative flex flex-col items-center gap-0.5 text-ink-soft hover:text-ink">
            <span className="relative">
              <ShoppingCart size={20} strokeWidth={1.6} />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
                  {count}
                </span>
              )}
            </span>
            <span className="hidden text-[11px] lg:block">Panier</span>
          </Link>
        </div>
      </div>

      <div className="border-t border-border px-4 pb-3 lg:hidden">
        <SearchBar />
      </div>

      <nav className="hidden border-t border-border lg:block">
        <div className="container-page flex h-11 items-center gap-7 overflow-x-auto text-sm">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`} className="whitespace-nowrap text-ink-soft hover:text-accent-dark">
              {cat.name}
            </Link>
          ))}
          <Link href="/produits?promotion=1" className="whitespace-nowrap font-medium text-accent-dark">
            Promotions
          </Link>
        </div>
      </nav>
    </header>
  );
}

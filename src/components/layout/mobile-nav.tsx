"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import { SearchBar } from "@/components/layout/search-bar";

type CategoryNode = { id: string; name: string; slug: string; children: CategoryNode[] };

export function MobileNav({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu" className="text-ink lg:hidden">
        <Menu size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <span className="font-display text-lg text-ink">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Fermer le menu">
                <X size={22} />
              </button>
            </div>

            <div className="border-b border-border p-4">
              <SearchBar onNavigate={() => setOpen(false)} />
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {categories.map((cat) => (
                <details key={cat.id} className="border-b border-border px-4 py-1 open:pb-2">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-2.5 text-sm font-medium text-ink">
                    <Link href={`/categories/${cat.slug}`} onClick={() => setOpen(false)}>
                      {cat.name}
                    </Link>
                    {cat.children.length > 0 && <ChevronRight size={16} className="text-muted" />}
                  </summary>
                  {cat.children.length > 0 && (
                    <ul className="ml-2 flex flex-col gap-2 pb-1 pl-2">
                      {cat.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/categories/${child.slug}`}
                            onClick={() => setOpen(false)}
                            className="text-sm text-muted hover:text-ink"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              ))}
              <div className="flex flex-col gap-1 px-4 py-3">
                <Link href="/tutoriels" onClick={() => setOpen(false)} className="py-1.5 text-sm text-ink-soft">
                  Tutoriels
                </Link>
                <Link href="/produits?promotion=1" onClick={() => setOpen(false)} className="py-1.5 text-sm text-ink-soft">
                  Promotions
                </Link>
                <Link href="/contact" onClick={() => setOpen(false)} className="py-1.5 text-sm text-ink-soft">
                  Contact
                </Link>
                <Link href="/faq" onClick={() => setOpen(false)} className="py-1.5 text-sm text-ink-soft">
                  FAQ
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

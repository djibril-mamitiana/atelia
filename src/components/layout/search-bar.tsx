"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { searchSuggestionsAction } from "@/server/actions/search.actions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type Suggestions = Awaited<ReturnType<typeof searchSuggestionsAction>>;

export function SearchBar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Suggestions | null>(null);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchSuggestionsAction(value);
        setResults(data);
        setOpen(true);
      });
    }, 250);
  }

  function goToSearchPage() {
    if (!query.trim()) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
  }

  const hasResults =
    results && (results.products.length + results.categories.length + results.brands.length + results.tutorials.length > 0);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToSearchPage();
        }}
        className="flex h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3.5"
      >
        <Search size={17} className="text-muted" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          type="search"
          placeholder="Rechercher un produit, une marque, un tutoriel…"
          className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {query && (
          <button type="button" onClick={() => handleChange("")} aria-label="Effacer" className="text-muted hover:text-ink">
            <X size={15} />
          </button>
        )}
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-surface shadow-xl">
          {!results ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Recherche…</p>
          ) : !hasResults ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Aucun résultat pour « {query} ».</p>
          ) : (
            <div className="divide-y divide-border">
              {results.products.length > 0 && (
                <SuggestionSection title="Produits">
                  {results.products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/produits/${p.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper"
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm bg-paper">
                        {p.images[0] && (
                          <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{p.name}</p>
                        <p className="text-xs text-muted">{p.brand.name}</p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-ink">{formatPrice(Number(p.price))}</span>
                    </Link>
                  ))}
                </SuggestionSection>
              )}

              {results.categories.length > 0 && (
                <SuggestionSection title="Catégories">
                  {results.categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/categories/${c.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="block px-4 py-2 text-sm text-ink hover:bg-paper"
                    >
                      {c.name}
                    </Link>
                  ))}
                </SuggestionSection>
              )}

              {results.brands.length > 0 && (
                <SuggestionSection title="Marques">
                  {results.brands.map((b) => (
                    <Link
                      key={b.id}
                      href={`/produits?marque=${b.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="block px-4 py-2 text-sm text-ink hover:bg-paper"
                    >
                      {b.name}
                    </Link>
                  ))}
                </SuggestionSection>
              )}

              {results.tutorials.length > 0 && (
                <SuggestionSection title="Tutoriels">
                  {results.tutorials.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tutoriels/${t.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="block px-4 py-2 text-sm text-ink hover:bg-paper"
                    >
                      {t.title}
                    </Link>
                  ))}
                </SuggestionSection>
              )}

              <button
                onClick={goToSearchPage}
                className="block w-full px-4 py-3 text-center text-sm font-medium text-accent-dark hover:bg-paper"
              >
                Voir tous les résultats pour « {query} »
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-1.5">
      <p className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
  );
}

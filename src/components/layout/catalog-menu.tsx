"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { id: string; name: string; slug: string; count: number };

/**
 * "Catalogue" mega menu. Opens on hover (with a short grace period so the
 * pointer can travel), on click/tap, and on keyboard focus; closes on
 * Escape, outside click and navigation.
 */
export function CatalogMenu({ items }: { items: Item[] }) {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pathname = usePathname();

  // Close on navigation (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function enter() {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function leave() {
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  return (
    <div ref={ref} className="flex h-full items-center" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
          open ? "bg-ink text-white" : "text-ink hover:bg-ink/5"
        )}
      >
        {t("catalog")}
        <ChevronDown size={15} className={cn("transition-transform duration-300", open && "rotate-180")} />
      </button>

      <div
        className={cn(
          "absolute inset-x-0 top-full origin-top border-b border-border bg-surface shadow-[0_40px_60px_-30px_rgba(13,15,18,0.35)] transition-all duration-300 ease-out",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        )}
      >
        <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,300px)_1fr]">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <p className="eyebrow text-muted">{t("catalogEyebrow")}</p>
              <p className="mt-3 font-display text-4xl leading-[1.05] text-ink">{t("catalogTitle")}</p>
            </div>
            <Link
              href="/produits"
              className="group inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-graphite transition-colors hover:bg-[#ff7440]"
            >
              {t("viewCatalog")}
              <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/categories/${item.slug}`}
                  className="group flex items-center justify-between gap-4 border-b border-border py-3 text-[15px] text-ink transition-colors hover:border-ink"
                >
                  <span className="transition-transform duration-300 group-hover:translate-x-1">{item.name}</span>
                  <ArrowUpRight size={15} className="shrink-0 text-muted opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-dark group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

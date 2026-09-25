"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { SearchBar } from "@/components/layout/search-bar";

/** Phone/tablet search: an icon button that drops a full-width search sheet. */
export function MobileSearch() {
  const t = useTranslations("SearchBar");
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("placeholder")}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
      >
        <Search size={20} strokeWidth={1.7} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-graphite/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-0 bg-surface px-4 pb-5 pt-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow text-muted">{t("placeholder")}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink/5">
                <X size={20} />
              </button>
            </div>
            <SearchBar onNavigate={() => setOpen(false)} autoFocus />
          </div>
        </div>
      )}
    </div>
  );
}

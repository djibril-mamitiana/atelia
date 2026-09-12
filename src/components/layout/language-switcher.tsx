"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<AppLocale, string> = { fr: "FR", de: "DE", en: "EN", it: "IT" };

// Small inline SVG flags — Windows' emoji font renders flag emoji as plain
// two-letter text instead of an actual flag, so a real (tiny) flag graphic
// is used here instead for a consistent look on every OS/browser.
function Flag({ locale, className }: { locale: AppLocale; className?: string }) {
  const common = { className: cn("h-3 w-4 shrink-0 rounded-[1px]", className), viewBox: "0 0 3 2" };
  switch (locale) {
    case "fr":
      return (
        <svg {...common}>
          <rect width="3" height="2" fill="#fff" />
          <rect width="1" height="2" fill="#002395" />
          <rect x="2" width="1" height="2" fill="#ED2939" />
        </svg>
      );
    case "de":
      return (
        <svg {...common}>
          <rect width="3" height="2" fill="#FFCE00" />
          <rect width="3" height="1.334" fill="#000" />
          <rect width="3" height="0.667" fill="#DD0000" />
        </svg>
      );
    case "it":
      return (
        <svg {...common}>
          <rect width="3" height="2" fill="#fff" />
          <rect width="1" height="2" fill="#009246" />
          <rect x="2" width="1" height="2" fill="#CE2B37" />
        </svg>
      );
    case "en":
      return (
        <svg {...common}>
          <rect width="3" height="2" fill="#00247D" />
          <path d="M0,0 3,2 M3,0 0,2" stroke="#fff" strokeWidth="0.4" />
          <path d="M0,0 3,2 M3,0 0,2" stroke="#CF142B" strokeWidth="0.16" />
          <path d="M1.5,0 V2 M0,1 H3" stroke="#fff" strokeWidth="0.66" />
          <path d="M1.5,0 V2 M0,1 H3" stroke="#CF142B" strokeWidth="0.4" />
        </svg>
      );
  }
}

export function LanguageSwitcher({
  variant = "dark",
  className,
}: {
  /** "dark" for use on the dark announcement bar, "light" for surfaces like the mobile menu. */
  variant?: "dark" | "light";
  className?: string;
}) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(next: AppLocale) {
    setOpen(false);
    router.replace(pathname, { locale: next });
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-xs font-medium focus:outline-none",
          variant === "dark"
            ? "border-white/20 text-paper/90 hover:border-white/40"
            : "border-border text-ink-soft hover:border-border-strong"
        )}
      >
        <Flag locale={locale} />
        {LABELS[locale]}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[7rem] overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => select(l)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-paper",
                  l === locale ? "font-semibold text-ink" : "text-ink-soft"
                )}
              >
                <Flag locale={l} />
                {LABELS[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

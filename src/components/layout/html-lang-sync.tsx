"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

/**
 * Keeps <html lang> correct after a client-side (soft) navigation between
 * locales. The root layout sits above the `[locale]` segment so its own
 * render — where <html lang> is set — isn't re-executed on a same-shell
 * navigation; this syncs the attribute imperatively from the part of the
 * tree that *does* re-render every time (this one, under `[locale]`).
 */
export function HtmlLangSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

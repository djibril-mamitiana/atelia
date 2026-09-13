import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PromoTicker } from "@/components/layout/promo-ticker";

// Locale validation, setRequestLocale and the NextIntlClientProvider all
// live one level up, in `[locale]/layout.tsx` — shared with /admin.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Reserves the space PromoTicker occupies (fixed, bottom-0, h-9) so it never covers the footer. */}
      <div aria-hidden="true" className="h-9" />
      <PromoTicker />
    </>
  );
}

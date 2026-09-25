import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RevealObserver } from "@/components/layout/reveal-observer";

// Locale validation, setRequestLocale and the NextIntlClientProvider all
// live one level up, in `[locale]/layout.tsx` — shared with /admin.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <RevealObserver />
    </>
  );
}

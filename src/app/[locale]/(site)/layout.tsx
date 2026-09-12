import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { HtmlLangSync } from "@/components/layout/html-lang-sync";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Scoped to this segment (not the root layout) — see the comment in
  // src/app/layout.tsx for why: this is the part of the tree that actually
  // re-renders on a client-side locale switch, so it's the only place this
  // context can stay in sync without a full page reload.
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLangSync />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Reserves the space PromoTicker occupies (fixed, bottom-0, h-9) so it never covers the footer. */}
      <div aria-hidden="true" className="h-9" />
      <PromoTicker />
    </NextIntlClientProvider>
  );
}

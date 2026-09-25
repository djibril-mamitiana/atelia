import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { HtmlLangSync } from "@/components/layout/html-lang-sync";

// Shared by every route under `[locale]` — the public storefront AND
// `/admin` (also localized now). Scoped here rather than the root layout:
// this segment re-renders on every client-side locale switch (the root
// layout, sitting above `[locale]`, does not) — see HtmlLangSync for the
// same reasoning applied to <html lang>.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const OG_LOCALE: Record<string, string> = { fr: "fr_FR", de: "de_DE", en: "en_GB", it: "it_IT" };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { description: t("description"), openGraph: { locale: OG_LOCALE[locale], description: t("description") } };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLangSync />
      {children}
    </NextIntlClientProvider>
  );
}

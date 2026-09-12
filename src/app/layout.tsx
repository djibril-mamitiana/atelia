import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Fraunces } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description:
    "Outillage, jardin, électricité, plomberie, peinture et décoration : des produits de qualité, des conseils et des tutoriels pour réussir tous vos projets.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image" },
};

// Root layout — the only place <html>/<body> is rendered, for every route
// including the unlocalized /admin.
//
// The i18n provider (NextIntlClientProvider) deliberately does NOT live
// here: this layout sits *above* the `[locale]` segment, so on a
// client-side navigation between two locales (e.g. clicking a link while
// on /de/... that leads to /fr/...) Next.js treats this shell as
// unaffected and does not re-render it — any locale/messages captured here
// would stay frozen at whichever locale first loaded the tab. The provider
// lives in `[locale]/(site)/layout.tsx` instead, which *is* part of the
// segment that changes and re-renders on every such navigation. See
// HtmlLangSync for the same reasoning applied to <html lang>.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

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

// Root layout — the only place <html>/<body> is rendered. Everything else
// (including the NextIntlClientProvider) lives in `[locale]/layout.tsx`:
// this shell sits *above* the `[locale]` segment, so on a client-side
// navigation between two locales Next.js treats it as unaffected and
// doesn't re-render it — any locale/messages captured here would stay
// frozen at whichever locale first loaded the tab.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

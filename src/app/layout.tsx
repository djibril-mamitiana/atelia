import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description:
    "Outils diamant professionnels : disques, couronnes de carottage, segments et ponçage pour le béton, l’asphalte et la pierre naturelle.",
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
    <html lang="fr" className={`${geist.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

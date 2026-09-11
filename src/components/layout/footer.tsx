import Link from "next/link";
import { Truck, ShieldCheck, RotateCcw, Headset } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

const REASSURANCE = [
  { icon: Truck, title: "Livraison rapide", description: "Dès 49 € d'achat, partout en France" },
  { icon: ShieldCheck, title: "Paiement sécurisé", description: "Transactions chiffrées via Stripe" },
  { icon: RotateCcw, title: "Retours simplifiés", description: "30 jours pour changer d'avis" },
  { icon: Headset, title: "Service client", description: "Une équipe à votre écoute 6j/7" },
];

const COLUMNS = [
  {
    title: "Acheter",
    links: [
      { href: "/produits", label: "Tout le catalogue" },
      { href: "/categories", label: "Catégories" },
      { href: "/produits?promotion=1", label: "Promotions" },
      { href: "/tutoriels", label: "Tutoriels & conseils" },
    ],
  },
  {
    title: "Mon compte",
    links: [
      { href: "/compte", label: "Mon compte" },
      { href: "/compte/commandes", label: "Suivre ma commande" },
      { href: "/compte/favoris", label: "Mes favoris" },
      { href: "/connexion", label: "Connexion" },
    ],
  },
  {
    title: "Aide",
    links: [
      { href: "/faq", label: "Questions fréquentes" },
      { href: "/contact", label: "Contact" },
      { href: "/faq#livraison", label: "Livraison & retrait" },
      { href: "/faq#retours", label: "Retours & remboursements" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
        {REASSURANCE.map((item) => (
          <div key={item.title} className="flex flex-col gap-2">
            <item.icon size={22} className="text-accent" strokeWidth={1.6} />
            <p className="text-sm font-medium text-ink">{item.title}</p>
            <p className="text-xs text-muted">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl text-ink">{SITE_NAME}</p>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Des produits de qualité, des conseils et des tutoriels pour vous accompagner dans chacun de vos
              projets, à la maison comme au jardin.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium text-ink">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE_NAME}. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/faq" className="hover:text-ink">
              Mentions légales
            </Link>
            <Link href="/faq" className="hover:text-ink">
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = { title: "FAQ" };

const SECTIONS = [
  {
    id: "commandes",
    title: "Commandes",
    items: [
      {
        q: "Comment suivre ma commande ?",
        a: "Rendez-vous dans votre compte, section « Commandes », puis cliquez sur la commande souhaitée pour voir son statut détaillé et son numéro de suivi.",
      },
      {
        q: "Puis-je modifier ou annuler ma commande ?",
        a: "Une commande peut être annulée tant qu'elle n'a pas été expédiée, en nous contactant via le formulaire de contact avec votre numéro de commande.",
      },
    ],
  },
  {
    id: "livraison",
    title: "Livraison & retrait",
    items: [
      {
        q: "Quels sont les délais de livraison ?",
        a: "Comptez 3 à 5 jours ouvrés en livraison standard, 1 à 2 jours en livraison express. Le retrait en magasin est disponible sous 2h dans les points relais partenaires.",
      },
      {
        q: "La livraison est-elle gratuite ?",
        a: "La livraison standard est offerte dès 49 € d'achat. En dessous, des frais de 5,90 € s'appliquent.",
      },
    ],
  },
  {
    id: "retours",
    title: "Retours & remboursements",
    items: [
      {
        q: "Combien de temps ai-je pour retourner un produit ?",
        a: "Vous disposez de 30 jours à compter de la réception pour retourner un produit non utilisé, dans son emballage d'origine.",
      },
      {
        q: "Comment obtenir un remboursement ?",
        a: "Une fois le retour reçu et vérifié, le remboursement est effectué sur votre moyen de paiement d'origine sous 5 jours ouvrés.",
      },
    ],
  },
  {
    id: "paiement",
    title: "Paiement",
    items: [
      {
        q: "Quels moyens de paiement acceptez-vous ?",
        a: "Toutes les cartes bancaires principales, via notre partenaire de paiement sécurisé Stripe. Nous ne stockons jamais vos données bancaires.",
      },
      {
        q: "Le paiement est-il sécurisé ?",
        a: "Oui, l'ensemble des transactions est chiffré et traité par Stripe, certifié PCI-DSS niveau 1.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">Questions fréquentes</h1>

      <div className="mt-8 flex flex-col gap-10">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="mb-3 font-display text-xl text-ink">{section.title}</h2>
            <div className="flex flex-col divide-y divide-border rounded-md border border-border">
              {section.items.map((item) => (
                <details key={item.q} className="group px-4 py-3.5">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
                    {item.q}
                    <ChevronDown size={16} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

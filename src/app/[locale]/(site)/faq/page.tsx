import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Faq");
  return { title: t("title") };
}

export default async function FaqPage() {
  const t = await getTranslations("Faq");

  const SECTIONS = [
    {
      id: "commandes",
      title: t("sectionOrders"),
      items: [
        { q: t("q1"), a: t("a1") },
        { q: t("q2"), a: t("a2") },
      ],
    },
    {
      id: "livraison",
      title: t("sectionShipping"),
      items: [
        { q: t("q3"), a: t("a3") },
        { q: t("q4"), a: t("a4") },
      ],
    },
    {
      id: "retours",
      title: t("sectionReturns"),
      items: [
        { q: t("q5"), a: t("a5") },
        { q: t("q6"), a: t("a6") },
      ],
    },
    {
      id: "paiement",
      title: t("sectionPayment"),
      items: [
        { q: t("q7"), a: t("a7") },
        { q: t("q8"), a: t("a8") },
      ],
    },
  ];

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">{t("title")}</h1>

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

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";

// Reuses the answers already written for the FAQ page — one source of truth.
const ITEMS = [3, 5, 7, 1] as const;

export async function FaqPreview() {
  const t = await getTranslations("Home");
  const tFaq = await getTranslations("Faq");

  return (
    <section className="bg-surface py-24 lg:py-36">
      <div className="container-page grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div data-reveal className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionHeading eyebrow={t("faqEyebrow")} title={t.rich("faqTitle", { em: (c) => <em className="text-accent-dark">{c}</em> })} />
            <p className="mt-8 text-[15px] text-ink-soft">{t("faqContactText")}</p>
            <Link href="/contact" className="group mt-2 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink">
              <span className="link-underline">{t("faqContact")}</span>
              <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7">
          {ITEMS.map((n, i) => (
            <details
              key={n}
              data-reveal
              data-reveal-delay={i * 70}
              name="home-faq"
              className="group border-t border-ink/15 last:border-b"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-7 text-left [&::-webkit-details-marker]:hidden">
                <span className="text-pretty text-lg font-medium leading-snug text-ink transition-colors group-hover:text-accent-dark lg:text-xl">
                  {tFaq(`q${n}` as "q1")}
                </span>
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/20 text-ink transition-[transform,background-color,border-color] duration-300 group-open:rotate-45 group-open:border-accent group-open:bg-accent">
                  <Plus size={17} />
                </span>
              </summary>
              <p className="max-w-2xl pb-8 pr-14 text-[16px] leading-relaxed text-ink-soft">{tFaq(`a${n}` as "a1")}</p>
            </details>
          ))}

          <Link
            href="/faq"
            className="group mt-8 inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
          >
            {t("faqAll")}
            <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

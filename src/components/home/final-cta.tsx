import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export async function FinalCta() {
  const t = await getTranslations("Home");

  return (
    <section className="container-page py-10 lg:py-16">
      <div
        data-reveal
        className="relative isolate overflow-hidden rounded-[2rem] bg-accent px-7 py-16 text-graphite sm:px-12 lg:rounded-[2.5rem] lg:px-20 lg:py-28"
      >
        <svg viewBox="0 0 600 600" aria-hidden="true" className="absolute -bottom-52 -right-40 -z-10 h-[600px] w-[600px] text-graphite/[0.12] lg:-right-16 lg:h-[780px] lg:w-[780px]" fill="none" stroke="currentColor">
          {[290, 236, 182, 128, 74].map((r) => (
            <circle key={r} cx="300" cy="300" r={r} strokeWidth="1.4" />
          ))}
          {Array.from({ length: 36 }, (_, i) => (
            <line key={i} x1="300" y1="4" x2="300" y2="22" strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * 10} 300 300)`} />
          ))}
        </svg>

        <h2 className="h-hero max-w-[18ch] lg:max-w-[16ch]">
          {t.rich("ctaTitle", { em: (c) => <em>{c}</em> })}
        </h2>
        <p className="mt-7 max-w-lg text-lg leading-relaxed text-graphite/75">{t("ctaText")}</p>

        <div className="mt-11 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/produits" variant="secondary" size="lg" className="w-full sm:w-auto">
            {t("ctaPrimary")}
            <ArrowRight size={18} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </LinkButton>
          <LinkButton
            href="/contact"
            variant="ghost"
            size="lg"
            className="w-full border border-graphite/40 text-graphite hover:bg-graphite/10 sm:w-auto"
          >
            {t("ctaSecondary")}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

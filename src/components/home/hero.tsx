import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen, Check, Ruler } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Blade } from "@/components/home/blade";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export async function Hero({ referencesCount, guidesCount }: { referencesCount: number; guidesCount: number }) {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const number = new Intl.NumberFormat(locale);
  const euros = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const threshold = euros.format(FREE_SHIPPING_THRESHOLD);

  const proof = [
    { value: number.format(referencesCount), label: t("proofRefs") },
    { value: number.format(guidesCount), label: t("proofGuides") },
    { value: "4", label: t("proofLangs") },
    { value: threshold, label: t("proofShipping") },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-graphite text-white">
      {/* Engineering-paper grid + a warm wash behind the blade. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.55] [background-image:linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_80%_70%_at_60%_40%,black,transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-40 top-0 -z-10 h-[620px] w-[620px] rounded-full bg-accent/20 blur-[140px]"
      />

      <div className="container-page grid items-center gap-10 pb-16 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-6 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-7">
          <p
            className="rise eyebrow inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/75"
            style={{ ["--d" as string]: "0ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t("heroKicker")}
          </p>

          <h1 className="rise h-hero mt-7 max-w-[15ch] text-white sm:max-w-[16ch] lg:max-w-none" style={{ ["--d" as string]: "90ms" }}>
            {t.rich("heroTitle", { em: (chunks) => <em className="text-accent">{chunks}</em> })}
          </h1>

          <p className="rise mt-7 max-w-xl text-[17px] leading-relaxed text-white/70 lg:text-lg" style={{ ["--d" as string]: "190ms" }}>
            {t("heroSubtitle", { count: number.format(referencesCount) })}
          </p>

          <div className="rise mt-9 flex flex-col gap-3 sm:flex-row" style={{ ["--d" as string]: "290ms" }}>
            <LinkButton href="/produits" size="lg" className="w-full sm:w-auto">
              {t("discoverProducts")}
              <ArrowRight size={18} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
            </LinkButton>
            <LinkButton href="/tutoriels" variant="light" size="lg" className="w-full sm:w-auto">
              <BookOpen size={17} />
              {t("viewTutorials")}
            </LinkButton>
          </div>

          <ul className="rise mt-10 flex flex-col gap-3 text-sm text-white/60 sm:flex-row sm:flex-wrap sm:gap-x-7" style={{ ["--d" as string]: "390ms" }}>
            {[t("heroTrust1", { threshold }), t("heroTrust2"), t("heroTrust3")].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check size={15} className="text-accent" strokeWidth={2.4} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rise relative lg:col-span-5" style={{ ["--d" as string]: "200ms" }}>
          <div className="relative mx-auto mt-4 aspect-square w-[92%] max-w-[460px] sm:max-w-[540px] lg:absolute lg:left-1/2 lg:top-1/2 lg:mx-0 lg:mt-0 lg:w-[122%] lg:max-w-none lg:-translate-x-[48%] lg:-translate-y-1/2">
            <Blade />

            <span className="absolute left-0 top-[8%] flex items-center gap-2 rounded-full border border-white/15 bg-graphite/70 px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/80 backdrop-blur sm:left-2 lg:left-[2%]">
              <Ruler size={13} className="text-accent" />
              {t("heroChipRange")}
            </span>
            <span className="absolute bottom-[10%] right-0 rounded-full border border-white/15 bg-graphite/70 px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/80 backdrop-blur sm:right-2 lg:right-[6%]">
              {t("heroChipMaterials")}
            </span>
          </div>
          <p className="eyebrow mt-6 text-center text-white/35 lg:hidden">{t("heroCaption")}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <dl className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-9 lg:grid-cols-4">
          {proof.map((item, i) => (
            <div key={item.label} data-reveal data-reveal-delay={i * 80} className="flex flex-col lg:border-l lg:border-white/10 lg:pl-8 lg:first:border-l-0 lg:first:pl-0">
              <dt className="order-2 mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-steel">{item.label}</dt>
              <dd className="font-display text-[2.6rem] leading-none tracking-[-0.02em] text-white lg:text-5xl">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

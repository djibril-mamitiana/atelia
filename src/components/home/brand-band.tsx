import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/home/section-heading";
import { Blade } from "@/components/home/blade";

export async function BrandBand({ brandSlug }: { brandSlug: string | null }) {
  const t = await getTranslations("Home");
  const materials = [t("brandMaterial1"), t("brandMaterial2"), t("brandMaterial3")];

  return (
    <section className="container-page py-6 lg:py-10">
      <div
        data-reveal
        className="relative isolate overflow-hidden rounded-[2rem] bg-graphite px-7 py-14 text-white sm:px-12 sm:py-16 lg:rounded-[2.5rem] lg:px-20 lg:py-24"
      >
        <div aria-hidden="true" className="absolute -right-24 -top-24 -z-10 h-[420px] w-[420px] rounded-full bg-accent/25 blur-[110px]" />
        <svg viewBox="0 0 600 600" aria-hidden="true" className="absolute -bottom-40 -right-40 -z-10 h-[560px] w-[560px] text-white/[0.07] lg:hidden" fill="none" stroke="currentColor">
          {[290, 240, 190, 140, 90].map((r) => (
            <circle key={r} cx="300" cy="300" r={r} strokeWidth="1.2" strokeDasharray={r === 190 ? "3 9" : undefined} />
          ))}
          {Array.from({ length: 36 }, (_, i) => (
            <line key={i} x1="300" y1="4" x2="300" y2="20" strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * 10} 300 300)`} />
          ))}
        </svg>

        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-1/2 -z-10 hidden aspect-square w-[560px] -translate-y-1/2 opacity-90 lg:block xl:-right-16 xl:w-[620px]">
          <Blade />
        </div>

        <SectionHeading
          tone="dark"
          eyebrow={t("brandEyebrow")}
          title={t.rich("brandTitle", { em: (c) => <em className="text-accent">{c}</em> })}
          lead={t("brandText")}
        />

        <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
          <span className="eyebrow mr-2 text-steel">{t("brandMaterialsLabel")}</span>
          {materials.map((m) => (
            <span key={m} className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85">
              {m}
            </span>
          ))}
        </div>

        <LinkButton href={brandSlug ? `/produits?marque=${brandSlug}` : "/produits"} size="lg" className="mt-12 w-full sm:w-auto">
          {t("brandCta")}
          <ArrowRight size={18} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
        </LinkButton>
      </div>
    </section>
  );
}

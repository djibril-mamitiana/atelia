import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Clock } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/home/section-heading";

type Guide = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
};

export async function Guides({ guides }: { guides: Guide[] }) {
  const t = await getTranslations("Home");
  const tTut = await getTranslations("Tutorials");
  if (guides.length === 0) return null;

  // Seeded descriptions repeat the title before an em dash; keep only the part that adds information.
  const clean = (g: Guide) => {
    const prefix = g.title + " — ";
    if (!g.description.startsWith(prefix)) return g.description;
    const rest = g.description.slice(prefix.length);
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  };

  const LEVELS = {
    BEGINNER: tTut("levelBeginner"),
    INTERMEDIATE: tTut("levelIntermediate"),
    ADVANCED: tTut("levelAdvanced"),
  } as const;

  return (
    <section className="container-page py-24 lg:py-36">
      <div data-reveal className="mb-12 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 lg:mb-16">
        <SectionHeading
          eyebrow={t("guidesEyebrow")}
          title={t.rich("guidesTitle", { em: (c) => <em className="text-accent-dark">{c}</em> })}
          lead={t("guidesSubtitle")}
        />
        <LinkButton href="/tutoriels" variant="outline">
          {t("guidesAll")}
          <ArrowUpRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </LinkButton>
      </div>

      <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
        {guides.map((guide, i) => (
          <div key={guide.id} data-reveal data-reveal-delay={i * 100} className="h-full">
            <Link
              href={`/tutoriels/${guide.slug}`}
              className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-7 transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1.5 hover:border-ink/30 hover:shadow-[0_34px_50px_-34px_rgba(13,15,18,0.45)] lg:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-5xl leading-none text-ink/[0.14]">0{i + 1}</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                  <Clock size={13} />
                  {tTut("minutesShort", { minutes: guide.durationMinutes })}
                </span>
              </div>

              <p className="eyebrow mt-10 text-accent-dark">{LEVELS[guide.level]}</p>
              <h3 className="mt-3 font-display text-[1.75rem] leading-[1.1] tracking-[-0.01em] text-ink">{guide.title}</h3>
              <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-ink-soft">{clean(guide)}</p>

              <span className="mt-auto flex items-center gap-2 pt-8 text-sm font-medium text-ink">
                <span className="link-underline">{t("guidesRead")}</span>
                <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

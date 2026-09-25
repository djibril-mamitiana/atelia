import { getTranslations } from "next-intl/server";
import { PackageCheck, Ruler, Search, ShoppingBag } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";

const ICONS = [Search, Ruler, ShoppingBag, PackageCheck];

export async function Process() {
  const t = await getTranslations("Home");

  const steps = [1, 2, 3, 4].map((n, i) => ({
    n,
    Icon: ICONS[i],
    title: t(`step${n}Title` as "step1Title"),
    text: t(`step${n}Text` as "step1Text"),
  }));

  return (
    <section className="bg-surface py-24 lg:py-36">
      <div className="container-page">
        <div data-reveal>
          <SectionHeading
            eyebrow={t("processEyebrow")}
            title={t.rich("processTitle", { em: (c) => <em className="text-accent-dark">{c}</em> })}
          />
        </div>

        <ol className="relative mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
          <div aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-px bg-border-strong lg:block" />
          {steps.map((step, i) => (
            <li key={step.n} data-reveal data-reveal-delay={i * 110} className="relative">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 bg-surface text-ink transition-colors duration-500 hover:border-accent hover:bg-accent">
                <step.Icon size={19} strokeWidth={1.6} />
              </div>
              <p className="mt-7 font-mono text-xs tracking-[0.12em] text-accent-dark">0{step.n}</p>
              <h3 className="mt-2 text-xl font-medium leading-snug text-ink">{step.title}</h3>
              <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

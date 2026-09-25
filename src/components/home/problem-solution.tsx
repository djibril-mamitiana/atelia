import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";

export async function ProblemSolution() {
  const t = await getTranslations("Home");

  const rows = [1, 2, 3].map((n) => ({
    n,
    problemTitle: t(`problem${n}Title` as "problem1Title"),
    problemText: t(`problem${n}Text` as "problem1Text"),
    solutionTitle: t(`solution${n}Title` as "solution1Title"),
    solutionText: t(`solution${n}Text` as "solution1Text"),
  }));

  return (
    <section className="container-page py-24 lg:py-36">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div data-reveal className="lg:col-span-5">
          <SectionHeading
            eyebrow={t("problemEyebrow")}
            title={t.rich("problemTitle", { em: (c) => <em className="text-accent-dark">{c}</em> })}
            lead={t("problemLead")}
            className="lg:sticky lg:top-32"
          />
        </div>

        <ol className="lg:col-span-7">
          {rows.map((row, i) => (
            <li
              key={row.n}
              data-reveal
              data-reveal-delay={i * 90}
              className="grid gap-6 border-t border-ink/15 py-9 last:border-b sm:grid-cols-[3rem_1fr_1fr] sm:gap-9"
            >
              <span className="font-mono text-sm text-muted">0{row.n}</span>

              <div>
                <p className="eyebrow mb-3 text-muted">{t("problemLabel")}</p>
                <h3 className="text-xl font-medium leading-snug text-ink/45 line-through decoration-ink/25 decoration-1">{row.problemTitle}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{row.problemText}</p>
              </div>

              <div className="relative sm:border-l sm:border-ink/15 sm:pl-9">
                <span className="absolute -left-[13px] top-0 hidden h-6 w-6 items-center justify-center rounded-full bg-accent text-graphite sm:flex">
                  <ArrowRight size={13} strokeWidth={2.4} />
                </span>
                <p className="eyebrow mb-3 text-accent-dark">{t("solutionLabel")}</p>
                <h3 className="text-xl font-medium leading-snug text-ink">{row.solutionTitle}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{row.solutionText}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

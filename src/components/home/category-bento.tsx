import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string; _count: { products: number } };

/** Concentric "blade" rings — a quiet texture that echoes the hero without needing photography. */
function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={cn("pointer-events-none absolute", className)} fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="96" strokeWidth="1" />
      <circle cx="100" cy="100" r="74" strokeWidth="1" />
      <circle cx="100" cy="100" r="52" strokeWidth="1" strokeDasharray="2 6" />
      <circle cx="100" cy="100" r="30" strokeWidth="1" />
      {Array.from({ length: 24 }, (_, i) => (
        <line key={i} x1="100" y1="2" x2="100" y2="10" strokeWidth="2" strokeLinecap="round" transform={`rotate(${i * 15} 100 100)`} />
      ))}
    </svg>
  );
}

export async function CategoryBento({ categories }: { categories: Category[] }) {
  const t = await getTranslations("Home");
  const tiles = categories.slice(0, 9);

  return (
    <section className="bg-surface py-24 lg:py-36">
      <div className="container-page">
        <div data-reveal className="mb-12 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 lg:mb-16">
          <SectionHeading eyebrow={t("categoriesEyebrow")} title={t("ourCategories")} lead={t("categoriesSubtitle")} />
          <LinkButton href="/produits" variant="outline">
            {t("allCategories")}
            <ArrowUpRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </LinkButton>
        </div>

        <div className="grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:auto-rows-[minmax(200px,auto)]">
          {tiles.map((cat, i) => {
            const big = i === 0;
            return (
              <div key={cat.id} data-reveal data-reveal-delay={(i % 4) * 70} className={cn("min-h-0", big && "col-span-2 lg:row-span-2")}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className={cn(
                    "group relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden rounded-3xl border border-border bg-paper p-4 transition-[background-color,color,border-color,transform,box-shadow] duration-500 ease-out",
                    "hover:-translate-y-1 hover:border-graphite hover:bg-graphite hover:text-white hover:shadow-[0_30px_50px_-30px_rgba(13,15,18,0.6)]",
                    big ? "min-h-[260px] p-6 sm:p-8 lg:p-10" : "sm:p-6 lg:p-7"
                  )}
                >
                  <Rings
                    className={cn(
                      "text-ink/[0.09] transition-[color,transform] duration-700 ease-out group-hover:rotate-45 group-hover:text-accent/40",
                      big ? "-bottom-24 -right-24 h-[420px] w-[420px]" : "-bottom-14 -right-14 h-[220px] w-[220px]"
                    )}
                  />

                  <div className="relative flex items-start justify-between">
                    <span className="font-mono text-xs text-muted transition-colors group-hover:text-steel">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 sm:h-10 sm:w-10 transition-[background-color,border-color,color,transform] duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-graphite">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>

                  <div className="relative mt-8 sm:mt-10">
                    <h3
                      className={cn(
                        "max-w-[16ch] leading-[1.08] tracking-[-0.01em]",
                        big ? "font-display text-[2.4rem] lg:text-6xl" : "text-[1rem] font-medium sm:text-[1.15rem]"
                      )}
                    >
                      {cat.name}
                    </h3>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted transition-colors group-hover:text-steel">
                      {t("productsCount", { count: cat._count.products })}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

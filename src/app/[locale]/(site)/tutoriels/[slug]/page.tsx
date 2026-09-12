import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Clock, BarChart3 } from "lucide-react";
import { getTutorialBySlug } from "@/server/queries/tutorials.queries";
import { LinkButton } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = await getTutorialBySlug(slug);
  if (!tutorial) return {};
  return { title: tutorial.title, description: tutorial.description };
}

export default async function TutorialPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tutorial = await getTutorialBySlug(slug);
  if (!tutorial) notFound();
  const t = await getTranslations("Tutorials");

  const LEVEL_LABELS: Record<string, string> = {
    BEGINNER: t("levelBeginner"),
    INTERMEDIATE: t("levelIntermediate"),
    ADVANCED: t("levelAdvanced"),
  };

  return (
    <div className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="aspect-video overflow-hidden rounded-md bg-ink">
            <video src={tutorial.videoUrl} controls poster={tutorial.thumbnailUrl ?? undefined} className="h-full w-full object-cover" />
          </div>

          <div className="mt-5 flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5"><Clock size={15} /> {t("minutesShort", { minutes: tutorial.durationMinutes })}</span>
            <span className="flex items-center gap-1.5"><BarChart3 size={15} /> {LEVEL_LABELS[tutorial.level]}</span>
          </div>

          <h1 className="mt-2 font-display text-3xl text-ink">{tutorial.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{tutorial.description}</p>

          <div className="mt-8 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{tutorial.content}</div>

          {tutorial.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tutorial.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-paper px-3 py-1 text-xs text-muted">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {tutorial.products.length > 0 && (
          <div>
            <p className="mb-3 font-medium text-ink">{t("productsUsed")}</p>
            <div className="flex flex-col gap-3">
              {tutorial.products.map((tp) => (
                <div key={tp.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-paper">
                    {tp.product.images[0] && <Image src={tp.product.images[0].url} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted">{tp.product.brand.name}</p>
                    <p className="truncate text-sm font-medium text-ink">{tp.product.name}</p>
                    <p className="text-sm text-ink">{formatPrice(Number(tp.product.price))}</p>
                  </div>
                  <LinkButton href={`/produits/${tp.product.slug}`} size="sm" variant="outline">
                    {t("view")}
                  </LinkButton>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10">
        <Link href="/tutoriels" className="text-sm text-muted hover:text-ink">{t("allTutorials")}</Link>
      </div>
    </div>
  );
}

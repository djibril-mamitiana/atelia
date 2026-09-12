import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlayCircle, Clock } from "lucide-react";
import { getPublishedTutorials } from "@/server/queries/tutorials.queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Tutorials");
  return { title: t("title") };
}

export default async function TutorialsPage() {
  const tutorials = await getPublishedTutorials();
  const t = await getTranslations("Tutorials");

  const LEVEL_LABELS: Record<string, string> = {
    BEGINNER: t("levelBeginner"),
    INTERMEDIATE: t("levelIntermediate"),
    ADVANCED: t("levelAdvanced"),
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">{t("title")}</h1>
      <p className="mt-1.5 max-w-xl text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tutorials.map((tut) => (
          <Link key={tut.id} href={`/tutoriels/${tut.slug}`} className="group flex flex-col gap-3">
            <div className="relative aspect-video overflow-hidden rounded-md bg-paper">
              {tut.thumbnailUrl && <Image src={tut.thumbnailUrl} alt={tut.title} fill sizes="33vw" className="object-cover transition-transform group-hover:scale-105" />}
              <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
                <PlayCircle size={38} className="text-white" strokeWidth={1.3} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{LEVEL_LABELS[tut.level]}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {t("minutesShort", { minutes: tut.durationMinutes })}</span>
            </div>
            <p className="font-medium text-ink group-hover:text-accent-dark">{tut.title}</p>
            <p className="line-clamp-2 text-sm text-muted">{tut.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

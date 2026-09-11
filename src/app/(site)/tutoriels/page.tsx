import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PlayCircle, Clock } from "lucide-react";
import { getPublishedTutorials } from "@/server/queries/tutorials.queries";

export const metadata: Metadata = { title: "Tutoriels & conseils" };

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export default async function TutorialsPage() {
  const tutorials = await getPublishedTutorials();

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">Tutoriels &amp; conseils</h1>
      <p className="mt-1.5 max-w-xl text-sm text-muted">
        Des guides pas à pas pour réussir vos projets, avec le matériel qu&apos;il vous faut à chaque étape.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tutorials.map((t) => (
          <Link key={t.id} href={`/tutoriels/${t.slug}`} className="group flex flex-col gap-3">
            <div className="relative aspect-video overflow-hidden rounded-md bg-paper">
              {t.thumbnailUrl && <Image src={t.thumbnailUrl} alt={t.title} fill sizes="33vw" className="object-cover transition-transform group-hover:scale-105" />}
              <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
                <PlayCircle size={38} className="text-white" strokeWidth={1.3} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{LEVEL_LABELS[t.level]}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {t.durationMinutes} min</span>
            </div>
            <p className="font-medium text-ink group-hover:text-accent-dark">{t.title}</p>
            <p className="line-clamp-2 text-sm text-muted">{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { SpecialBandItem } from "@/server/queries/catalog.queries";

/**
 * "Produits spéciaux": photos and products of the categories ticked
 * "Produits spéciaux" in the admin, sliding slowly across the page. A tap or
 * click opens the item (its category on that photo, or its product page).
 */
export async function SpecialBand({ items }: { items: SpecialBandItem[] }) {
  if (items.length === 0) return null;
  const t = await getTranslations("Home");

  // Rendered twice for a seamless loop; the copy is hidden from assistive tech.
  const cards = (copy: boolean) =>
    items.map((item) => (
      <li key={`${copy ? "copy-" : ""}${item.key}`} aria-hidden={copy || undefined} className={copy ? "marquee-copy shrink-0 pr-4" : "shrink-0 pr-4"}>
        <Link href={item.href} tabIndex={copy ? -1 : undefined} className="group/card block w-40 sm:w-48">
          <span className="relative block aspect-square overflow-hidden rounded-2xl border border-border bg-white">
            <Image
              src={item.imageUrl}
              alt={copy ? "" : item.label}
              fill
              sizes="192px"
              className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            />
          </span>
          <span className="mt-2 block truncate text-sm text-ink-soft transition-colors group-hover/card:text-accent-dark">{item.label}</span>
        </Link>
      </li>
    ));

  return (
    <section aria-labelledby="special-band-title" className="border-b border-border bg-surface py-10 lg:py-12">
      <div className="container-page mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div>
          <p className="eyebrow text-accent-dark">{t("specialEyebrow")}</p>
          <h2 id="special-band-title" className="mt-2 font-display text-3xl leading-tight text-ink">
            {t("specialTitle")}
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted">{t("specialSubtitle")}</p>
      </div>
      <div className="marquee-track overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
        <ul className="marquee flex w-max" style={{ ["--marquee-duration" as string]: `${Math.max(40, items.length * 5)}s` }}>
          {cards(false)}
          {cards(true)}
        </ul>
      </div>
    </section>
  );
}

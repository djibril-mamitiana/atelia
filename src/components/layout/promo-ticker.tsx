import { getTranslations } from "next-intl/server";

/**
 * Fixed bar at the bottom of the viewport with an infinitely scrolling
 * strip of messages. Pauses as soon as the cursor moves over it (CSS
 * `:hover`, see `.marquee-track` in globals.css) so it's readable/clickable.
 * `SiteLayout` reserves matching space below the footer so this never
 * covers real content.
 */
export async function PromoTicker() {
  const t = await getTranslations("PromoTicker");
  const messages = t.raw("messages") as string[];
  const items = [...messages, ...messages];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 bottom-0 z-40 h-9 overflow-hidden border-t border-border bg-ink text-paper/90"
    >
      <div className="marquee-track flex h-9 w-max items-center gap-12 whitespace-nowrap px-4 text-xs font-medium tracking-wide sm:text-sm">
        {items.map((message, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-accent-soft" />
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}

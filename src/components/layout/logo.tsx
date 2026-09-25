import { Link } from "@/i18n/navigation";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Wordmark: a small segmented-blade mark + the name in the display serif. */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link
      href="/"
      aria-label={SITE_NAME}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5",
        tone === "light" ? "text-white" : "text-ink",
        className
      )}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 transition-transform duration-700 ease-out group-hover:rotate-90" aria-hidden="true">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x="15"
            y="1.5"
            width="2"
            height="4.5"
            rx="0.6"
            fill="currentColor"
            transform={`rotate(${i * 30} 16 16)`}
          />
        ))}
        <circle cx="16" cy="16" r="4" fill="var(--color-accent)" />
      </svg>
      <span className="font-display text-[1.75rem] leading-none tracking-[-0.02em]">{SITE_NAME}</span>
    </Link>
  );
}

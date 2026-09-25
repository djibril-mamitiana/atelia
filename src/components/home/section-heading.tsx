import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Eyebrow + large serif title (+ optional lead). Used by every home section. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "light",
  className,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  tone?: "light" | "dark";
  className?: string;
  children?: ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-3xl", className)}>
      <p className={cn("eyebrow mb-5 flex items-center gap-2.5", dark ? "text-steel" : "text-muted")}>
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {eyebrow}
      </p>
      <h2 className={cn("h-section", dark ? "text-white" : "text-ink")}>{title}</h2>
      {lead && <p className={cn("mt-6 max-w-2xl text-[17px] leading-relaxed", dark ? "text-white/65" : "text-ink-soft")}>{lead}</p>}
      {children}
    </div>
  );
}

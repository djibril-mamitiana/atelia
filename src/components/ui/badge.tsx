import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "accent" | "sage" | "gold" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent-dark",
  sage: "bg-sage-soft text-sage",
  gold: "bg-[#f5ecd7] text-gold",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-paper text-muted border border-border",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

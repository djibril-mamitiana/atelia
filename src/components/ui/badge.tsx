import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "accent" | "sage" | "gold" | "danger" | "neutral" | "dark";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent text-graphite",
  sage: "bg-sage-soft text-sage",
  gold: "bg-[#f3e6c8] text-gold",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-paper text-muted border border-border",
  dark: "bg-graphite text-white",
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
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase leading-[1.15] tracking-[0.08em]",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

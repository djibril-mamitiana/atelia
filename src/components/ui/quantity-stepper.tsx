"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex h-10 items-center rounded-md border border-border-strong", className)}>
      <button
        type="button"
        aria-label="Diminuer la quantité"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-full w-9 items-center justify-center text-ink-soft transition-colors hover:bg-paper disabled:opacity-40"
      >
        <Minus size={15} />
      </button>
      <span className="w-9 text-center text-sm font-medium text-ink" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Augmenter la quantité"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-full w-9 items-center justify-center text-ink-soft transition-colors hover:bg-paper disabled:opacity-40"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

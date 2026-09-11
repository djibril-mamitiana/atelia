import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(rating * 2) / 2; // nearest half-star
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= rounded;
        return (
          <Star
            key={i}
            size={size}
            className={filled ? "fill-gold text-gold" : "fill-transparent text-border-strong"}
            strokeWidth={1.5}
          />
        );
      })}
    </div>
  );
}

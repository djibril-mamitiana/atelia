"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { toggleFavoriteAction } from "@/server/actions/favorite.actions";
import { cn } from "@/lib/utils";

export function FavoriteButton({ productId, initialFavorite }: { productId: string; initialFavorite: boolean }) {
  const { toast } = useToast();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setFavorite((f) => !f);
    startTransition(async () => {
      const result = await toggleFavoriteAction(productId);
      if (!result.success) {
        setFavorite((f) => !f);
        toast(result.error, "error");
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorite}
      aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent"
    >
      <Heart size={17} className={cn(favorite && "fill-accent text-accent")} />
      {favorite ? "Dans vos favoris" : "Ajouter aux favoris"}
    </button>
  );
}

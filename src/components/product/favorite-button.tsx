"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { toggleFavoriteAction } from "@/server/actions/favorite.actions";
import { cn } from "@/lib/utils";

export function FavoriteButton({ productId, initialFavorite }: { productId: string; initialFavorite: boolean }) {
  const t = useTranslations("Product");
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
      aria-label={favorite ? t("removeFromFavorites") : t("addToFavorites")}
      className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent"
    >
      <Heart size={17} className={cn(favorite && "fill-accent text-accent")} />
      {favorite ? t("inFavorites") : t("addToFavorites")}
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { submitReviewAction } from "@/server/actions/review.actions";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitReviewAction({ productId, rating, title, comment });
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      setSubmitted(true);
      toast("Merci, votre avis a été soumis et sera publié après modération.", "success");
    });
  }

  if (submitted) {
    return (
      <p className="rounded-md bg-sage-soft px-4 py-3 text-sm text-sage">
        Votre avis a bien été enregistré et sera visible après validation.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border p-5">
      <p className="text-sm font-medium text-ink">Laisser un avis</p>

      <div>
        <Label>Note</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} étoiles`}>
              <Star size={22} className={cn(n <= rating ? "fill-gold text-gold" : "text-border-strong")} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="review-title">Titre (optionnel)</Label>
        <Input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>

      <div>
        <Label htmlFor="review-comment">Votre avis</Label>
        <Textarea id="review-comment" required minLength={10} rows={4} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Envoi…" : "Publier mon avis"}
      </Button>
      <p className="text-xs text-muted">
        Réservé aux clients ayant reçu ce produit dans une commande livrée.
      </p>
    </form>
  );
}

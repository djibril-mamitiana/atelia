import { RatingStars } from "@/components/ui/rating-stars";
import { formatDate } from "@/lib/format";

type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: Date;
  user: { firstName: string; lastName: string };
};

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted">Aucun avis publié pour ce produit pour le moment.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {reviews.map((review) => (
        <div key={review.id} className="flex flex-col gap-1.5 py-4">
          <div className="flex items-center justify-between">
            <RatingStars rating={review.rating} />
            <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
          </div>
          {review.title && <p className="text-sm font-medium text-ink">{review.title}</p>}
          <p className="text-sm text-ink-soft">{review.comment}</p>
          <p className="text-xs text-muted">
            {review.user.firstName} {review.user.lastName.charAt(0)}.
          </p>
        </div>
      ))}
    </div>
  );
}

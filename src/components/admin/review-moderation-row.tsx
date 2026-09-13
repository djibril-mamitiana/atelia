"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Check, X } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import { useToast } from "@/components/ui/toast";
import { moderateReviewAction } from "@/server/actions/admin/review.actions";

export function ReviewModerationRow({
  id,
  productName,
  userName,
  rating,
  title,
  comment,
  status,
}: {
  id: string;
  productName: string;
  userName: string;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
}) {
  const t = useTranslations("Admin.Reviews");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function moderate(next: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await moderateReviewAction(id, next);
      if (!result.success) return toast(result.error, "error");
      toast(next === "APPROVED" ? t("toastApproved") : t("toastRejected"), "success");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border p-4 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{productName}</p>
          <p className="text-xs text-muted">{userName}</p>
        </div>
        <RatingStars rating={rating} />
      </div>
      {title && <p className="text-sm font-medium text-ink">{title}</p>}
      <p className="text-sm text-ink-soft">{comment}</p>
      {status === "PENDING" && (
        <div className="mt-1 flex gap-2">
          <button onClick={() => moderate("APPROVED")} disabled={pending} className="flex items-center gap-1 text-xs font-medium text-sage hover:underline">
            <Check size={14} /> {t("approve")}
          </button>
          <button onClick={() => moderate("REJECTED")} disabled={pending} className="flex items-center gap-1 text-xs font-medium text-danger hover:underline">
            <X size={14} /> {t("reject")}
          </button>
        </div>
      )}
    </div>
  );
}

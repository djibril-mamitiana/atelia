import { adminTitle } from "@/lib/admin-metadata";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminReviews } from "@/server/queries/admin.queries";
import { ReviewModerationRow } from "@/components/admin/review-moderation-row";

export const generateMetadata = () => adminTitle("navReviews");

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const t = await getTranslations("Admin.Reviews");
  const { status } = await searchParams;
  const reviews = await getAdminReviews({ status: status as "PENDING" | "APPROVED" | "REJECTED" | undefined });

  const TABS: { value: "PENDING" | "APPROVED" | "REJECTED" | undefined; label: string }[] = [
    { value: "PENDING", label: t("tabPending") },
    { value: "APPROVED", label: t("tabApproved") },
    { value: "REJECTED", label: t("tabRejected") },
    { value: undefined, label: t("tabAll") },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("title")}</h1>

      <div className="mt-4 flex gap-1.5">
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/admin/reviews?status=${tab.value}` : "/admin/reviews"}
            className={`rounded-full border px-3 py-1 text-xs ${status === tab.value || (!status && !tab.value) ? "border-ink bg-ink text-white" : "border-border-strong text-muted"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface">
        {reviews.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">{t("empty")}</p>
        ) : (
          reviews.map((r) => (
            <ReviewModerationRow
              key={r.id}
              id={r.id}
              productName={r.product.name}
              userName={`${r.user.firstName} ${r.user.lastName}`}
              rating={r.rating}
              title={r.title}
              comment={r.comment}
              status={r.status}
            />
          ))
        )}
      </div>
    </div>
  );
}

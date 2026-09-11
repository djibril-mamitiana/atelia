import { Check } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIMELINE_STEPS: { status: string; label: string }[] = [
  { status: "PENDING", label: "Commande créée" },
  { status: "CONFIRMED", label: "Paiement confirmé" },
  { status: "PROCESSING", label: "Préparation" },
  { status: "SHIPPED", label: "Expédiée" },
  { status: "OUT_FOR_DELIVERY", label: "En livraison" },
  { status: "DELIVERED", label: "Livrée" },
];

export function OrderStatusTimeline({
  currentStatus,
  history,
}: {
  currentStatus: string;
  history: { status: string; comment: string | null; createdAt: Date }[];
}) {
  if (currentStatus === "CANCELLED" || currentStatus === "REFUNDED") {
    const entry = history.find((h) => h.status === currentStatus);
    return (
      <div className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
        <p className="font-medium">{currentStatus === "CANCELLED" ? "Commande annulée" : "Commande remboursée"}</p>
        {entry && <p className="mt-1 text-xs">{formatDateTime(entry.createdAt)} — {entry.comment}</p>}
      </div>
    );
  }

  const reachedIndex = TIMELINE_STEPS.findIndex((s) => s.status === currentStatus);
  const historyByStatus = new Map(history.map((h) => [h.status, h]));

  return (
    <ol className="flex flex-col gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const reached = i <= reachedIndex;
        const entry = historyByStatus.get(step.status);
        const isLast = i === TIMELINE_STEPS.length - 1;
        return (
          <li key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  reached ? "bg-sage text-white" : "bg-paper text-muted"
                )}
              >
                {reached ? <Check size={14} /> : <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />}
              </span>
              {!isLast && <span className={cn("w-px flex-1", reached ? "bg-sage" : "bg-border")} />}
            </div>
            <div className="pb-6">
              <p className={cn("text-sm font-medium", reached ? "text-ink" : "text-muted")}>{step.label}</p>
              {entry && <p className="text-xs text-muted">{formatDateTime(entry.createdAt)}{entry.comment ? ` — ${entry.comment}` : ""}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

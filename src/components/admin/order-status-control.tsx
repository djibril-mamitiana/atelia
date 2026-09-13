"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Select, Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateOrderStatusAction, updateTrackingAction } from "@/server/actions/admin/order.actions";
import type { OrderStatus } from "@prisma/client";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function OrderStatusControl({
  orderId,
  currentStatus,
  paymentProvider,
  paymentStatus,
  carrier,
  trackingNumber,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  paymentProvider?: string;
  paymentStatus?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
}) {
  const t = useTranslations("Admin.OrderStatusControl");
  const tStatus = useTranslations("Admin.OrderStatus");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [comment, setComment] = useState("");
  const [carrierValue, setCarrierValue] = useState(carrier ?? "");
  const [trackingValue, setTrackingValue] = useState(trackingNumber ?? "");

  const options = VALID_TRANSITIONS[currentStatus];
  const awaitingBankTransfer = currentStatus === "PENDING" && paymentProvider === "BANK_TRANSFER" && paymentStatus !== "PAID";

  function submitStatus() {
    if (!nextStatus) return;
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, nextStatus, comment);
      if (!result.success) return toast(result.error, "error");
      toast(t("toastStatusUpdated"), "success");
      setNextStatus("");
      setComment("");
      router.refresh();
    });
  }

  function submitTracking() {
    startTransition(async () => {
      const result = await updateTrackingAction(orderId, carrierValue, trackingValue);
      if (!result.success) return toast(result.error, "error");
      toast(t("toastTrackingUpdated"), "success");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {awaitingBankTransfer && (
        <div className="rounded-md border border-accent/30 bg-accent-soft p-4 text-sm text-ink-soft">
          {t("bankTransferPrefix")} <strong>{t("bankTransferStrong")}</strong>{" "}
          {t("bankTransferSuffix")}
        </div>
      )}

      {options.length > 0 && (
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="mb-3 text-sm font-medium text-ink">{t("changeStatus")}</p>
          <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as OrderStatus)}>
            <option value="">{t("chooseNewStatus")}</option>
            {options.map((s) => (
              <option key={s} value={s}>
                {s === "CONFIRMED" && awaitingBankTransfer ? t("confirmedBankReceived") : tStatus(s)}
              </option>
            ))}
          </Select>
          <Input className="mt-2" placeholder={t("commentPlaceholder")} value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button size="sm" className="mt-3" onClick={submitStatus} disabled={!nextStatus || pending}>
            {t("validate")}
          </Button>
        </div>
      )}

      <div className="rounded-md border border-border bg-surface p-4">
        <p className="mb-3 text-sm font-medium text-ink">{t("carrierTracking")}</p>
        <div className="flex flex-col gap-2">
          <div>
            <Label>{t("labelCarrier")}</Label>
            <Input value={carrierValue} onChange={(e) => setCarrierValue(e.target.value)} />
          </div>
          <div>
            <Label>{t("labelTracking")}</Label>
            <Input value={trackingValue} onChange={(e) => setTrackingValue(e.target.value)} />
          </div>
          <Button size="sm" variant="outline" className="self-start" onClick={submitTracking} disabled={pending}>
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

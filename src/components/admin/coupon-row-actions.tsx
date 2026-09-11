"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { toggleCouponActiveAction, deleteCouponAction } from "@/server/actions/admin/coupon.actions";

export function CouponRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await toggleCouponActiveAction(id, !isActive);
      if (!result.success) return toast(result.error, "error");
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Supprimer ce code promo ?")) return;
    startTransition(async () => {
      const result = await deleteCouponAction(id);
      if (!result.success) return toast(result.error, "error");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={toggle} disabled={pending} className="text-xs font-medium text-accent-dark hover:underline">
        {isActive ? "Désactiver" : "Activer"}
      </button>
      <button onClick={remove} disabled={pending} className="text-muted hover:text-danger">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

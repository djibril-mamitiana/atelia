"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CouponForm({ error }: { error?: string }) {
  const t = useTranslations("Cart");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("promo") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (code.trim()) params.set("promo", code.trim());
    else params.delete("promo");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input placeholder={t("couponPlaceholder")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <Button type="submit" variant="outline">
          {t("couponApply")}
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createCouponAction } from "@/server/actions/admin/coupon.actions";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CouponForm({ categories, products }: { categories: { id: string; name: string }[]; products: { id: string; name: string }[] }) {
  const t = useTranslations("Admin.Promotions");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const today = new Date();
  const inThreeMonths = new Date(today.getTime() + 90 * 86400000);

  const [form, setForm] = useState({
    code: "",
    type: "PERCENT" as "PERCENT" | "FIXED",
    value: 10,
    minPurchase: "",
    startsAt: toDateInputValue(today),
    endsAt: toDateInputValue(inThreeMonths),
    usageLimit: "",
    usageLimitPerUser: "1",
    categoryId: "",
    productId: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCouponAction({
        code: form.code,
        type: form.type,
        value: form.value,
        minPurchase: form.minPurchase ? Number(form.minPurchase) : null,
        startsAt: new Date(form.startsAt),
        endsAt: new Date(form.endsAt),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        usageLimitPerUser: form.usageLimitPerUser ? Number(form.usageLimitPerUser) : null,
        categoryId: form.categoryId || null,
        productId: form.productId || null,
      });
      if (!result.success) return toast(result.error, "error");
      toast(t("toastCreated"), "success");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>{t("newCoupon")}</Button>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-ink bg-surface p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>{t("code")}</Label>
          <Input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
        </div>
        <div>
          <Label>{t("type")}</Label>
          <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERCENT" | "FIXED" }))}>
            <option value="PERCENT">{t("percentOption")}</option>
            <option value="FIXED">{t("fixedOption")}</option>
          </Select>
        </div>
        <div>
          <Label>{t("value")}</Label>
          <Input type="number" step="0.01" required value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} />
        </div>
        <div>
          <Label>{t("minPurchase")}</Label>
          <Input type="number" value={form.minPurchase} onChange={(e) => setForm((f) => ({ ...f, minPurchase: e.target.value }))} />
        </div>
        <div>
          <Label>{t("startsAt")}</Label>
          <Input type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
        </div>
        <div>
          <Label>{t("endsAt")}</Label>
          <Input type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
        </div>
        <div>
          <Label>{t("usageLimit")}</Label>
          <Input type="number" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
        </div>
        <div>
          <Label>{t("usageLimitPerUser")}</Label>
          <Input type="number" value={form.usageLimitPerUser} onChange={(e) => setForm((f) => ({ ...f, usageLimitPerUser: e.target.value }))} />
        </div>
        <div>
          <Label>{t("targetCategory")}</Label>
          <Select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
            <option value="">{t("allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("targetProduct")}</Label>
          <Select value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}>
            <option value="">{t("allProducts")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{t("create")}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

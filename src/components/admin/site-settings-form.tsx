"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateSiteSettingsAction } from "@/server/actions/admin/settings.actions";

type Values = { contactEmail: string; contactPhone: string; shippingStandard: string; shippingExpress: string };

export function SiteSettingsForm({ initial, canEdit }: { initial: Values; canEdit: boolean }) {
  const t = useTranslations("Admin.Settings");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);

  function set<K extends keyof Values>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSiteSettingsAction({
        ...form,
        // Accept "5,90" as typed on a French keyboard.
        shippingStandard: form.shippingStandard.replace(",", "."),
        shippingExpress: form.shippingExpress.replace(",", "."),
      });
      if (!result.success) return toast(result.error, "error");
      toast(t("shopSaved"), "success");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-border bg-surface p-5">
      <p className="font-medium text-ink">{t("shopSection")}</p>
      <p className="mb-4 mt-1 text-xs text-muted">{t("shopHint")}</p>

      <fieldset disabled={!canEdit || pending} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
          <Input id="contactPhone" type="tel" required value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
          <Input id="contactEmail" type="email" required value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="shippingStandard">{t("shippingStandard")}</Label>
          <Input id="shippingStandard" inputMode="decimal" required value={form.shippingStandard} onChange={(e) => set("shippingStandard", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="shippingExpress">{t("shippingExpress")}</Label>
          <Input id="shippingExpress" inputMode="decimal" required value={form.shippingExpress} onChange={(e) => set("shippingExpress", e.target.value)} />
        </div>
      </fieldset>

      {canEdit ? (
        <Button type="submit" size="sm" disabled={pending} className="mt-4">{t("shopSave")}</Button>
      ) : (
        <p className="mt-4 text-xs text-muted">{t("shopAdminOnly")}</p>
      )}
    </form>
  );
}

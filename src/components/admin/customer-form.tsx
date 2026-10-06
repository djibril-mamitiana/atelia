"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { generateCustomerCode } from "@/lib/auth/customer-code";
import { createCustomerAction, updateCustomerAction, deleteCustomerAction } from "@/server/actions/admin/customer.actions";
import type { AdminCustomerInput } from "@/validations/auth.schema";

/** Create (no `customerId`) or edit a pro customer account. */
export function CustomerForm({
  customerId,
  initial,
  canDelete = false,
}: {
  customerId?: string;
  /** For creation, comes with a freshly generated code (made on the server so
   *  SSR and hydration agree); staff can still type their own, e.g. the
   *  customer number from their accounting software. */
  initial: AdminCustomerInput;
  canDelete?: boolean;
}) {
  const t = useTranslations("Admin.CustomerForm");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<AdminCustomerInput>(initial);

  function set<K extends keyof AdminCustomerInput>(key: K, value: AdminCustomerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = customerId ? await updateCustomerAction(customerId, form) : await createCustomerAction(form);
      if (!result.success) return toast(result.error, "error");
      toast(customerId ? t("toastUpdated") : t("toastCreated"), "success");
      if (customerId) router.refresh();
      else router.push(`/admin/customers/${result.id}`);
    });
  }

  function handleDelete() {
    if (!customerId || !confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deleteCustomerAction(customerId);
      if (!result.success) return toast(result.error, "error");
      toast(t("toastDeleted"), "success");
      router.push("/admin/customers");
    });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(form.customerCode);
      toast(t("codeCopied"), "success");
    } catch {
      // Clipboard can be blocked (http, permissions) — the code is visible anyway.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">{t("labelFirstName")}</Label>
          <Input id="firstName" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="lastName">{t("labelLastName")}</Label>
          <Input id="lastName" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="company">{t("labelCompany")}</Label>
          <Input id="company" value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">{t("labelEmail")}</Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">{t("labelPhone")}</Label>
          <Input id="phone" type="tel" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="customerCode">{t("labelCode")}</Label>
          <div className="flex gap-2">
            <Input
              id="customerCode"
              required
              autoComplete="off"
              value={form.customerCode}
              onChange={(e) => set("customerCode", e.target.value.toUpperCase())}
              className="font-mono tracking-wider"
            />
            <Button type="button" variant="outline" onClick={() => set("customerCode", generateCustomerCode())} title={t("generate")}>
              <RefreshCw size={15} /> <span className="max-sm:hidden">{t("generate")}</span>
            </Button>
            <Button type="button" variant="ghost" onClick={copyCode} aria-label={t("copy")} title={t("copy")}>
              <Copy size={15} />
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-muted">{t("codeHint")}</p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-accent" />
        {t("activeCheckbox")}
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>{customerId ? t("save") : t("create")}</Button>
        {customerId && canDelete && (
          <Button type="button" variant="ghost" onClick={handleDelete} disabled={pending} className="ml-auto text-danger">
            <Trash2 size={15} /> {t("delete")}
          </Button>
        )}
      </div>
    </form>
  );
}

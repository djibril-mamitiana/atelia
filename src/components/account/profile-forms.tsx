"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction, changePasswordAction } from "@/server/actions/profile.actions";

export function ProfileForm({
  initial,
}: {
  initial: { firstName: string; lastName: string; phone: string };
}) {
  const t = useTranslations("Account");
  const tAuth = useTranslations("Auth");
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfileAction(form);
      toast(result.success ? t("profileUpdated") : result.error, result.success ? "success" : "error");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border p-5">
      <p className="font-medium text-ink">{t("personalInfo")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName">{tAuth("firstNameLabel")}</Label>
          <Input id="firstName" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="lastName">{tAuth("lastNameLabel")}</Label>
          <Input id="lastName" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const t = useTranslations("Account");
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await changePasswordAction({ currentPassword, newPassword });
      toast(result.success ? t("passwordUpdated") : result.error, result.success ? "success" : "error");
      if (result.success) {
        setCurrentPassword("");
        setNewPassword("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border p-5">
      <p className="font-medium text-ink">{t("security")}</p>
      <div>
        <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
        <Input id="currentPassword" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="newPassword">{t("newPassword")}</Label>
        <Input id="newPassword" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t("saving") : t("changePassword")}
      </Button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/server/actions/auth.actions";

export function RegisterForm({ nextPath }: { nextPath?: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "" });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await registerAction(form);
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      router.push(nextPath || "/compte");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      {error && <p className="rounded-md bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">{t("firstNameLabel")}</Label>
          <Input id="firstName" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          <FieldError>{fieldErrors.firstName?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="lastName">{t("lastNameLabel")}</Label>
          <Input id="lastName" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          <FieldError>{fieldErrors.lastName?.[0]}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        <FieldError>{fieldErrors.email?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>

      <div>
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        <p className="mt-1.5 text-xs text-muted">{t("passwordHint")}</p>
        <FieldError>{fieldErrors.password?.[0]}</FieldError>
      </div>

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? t("register.submitPending") : t("register.submit")}
      </Button>
    </form>
  );
}

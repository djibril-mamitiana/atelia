"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/server/actions/password-reset.actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(token, password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/connexion");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      {error && <p className="rounded-md bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      <div>
        <Label htmlFor="password">{t("newPasswordLabel")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-muted">{t("passwordHint")}</p>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("resetPassword.submitPending") : t("resetPassword.submit")}
      </Button>
    </form>
  );
}

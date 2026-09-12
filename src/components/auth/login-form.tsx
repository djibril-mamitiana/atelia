"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/server/actions/auth.actions";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction({ email, password });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(nextPath || "/compte");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      {error && <p className="rounded-md bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <Link href="/mot-de-passe-oublie" className="text-xs text-muted hover:text-accent-dark">
            {t("login.forgotPassword")}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? t("login.submitPending") : t("login.submit")}
      </Button>
    </form>
  );
}

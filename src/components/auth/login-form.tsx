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
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction({ email, code });
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
          <Label htmlFor="code">{t("customerCodeLabel")}</Label>
          <Link href="/contact" className="text-xs text-muted hover:text-accent-dark">
            {t("login.forgotCode")}
          </Link>
        </div>
        {/* type=password: the code is a credential, keep it off screen and out of autofill history. */}
        <Input
          id="code"
          type="password"
          autoComplete="current-password"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-muted">{t("login.codeHint")}</p>
      </div>

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? t("login.submitPending") : t("login.submit")}
      </Button>
    </form>
  );
}

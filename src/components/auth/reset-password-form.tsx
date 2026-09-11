"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/server/actions/password-reset.actions";

export function ResetPasswordForm({ token }: { token: string }) {
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
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-muted">8 caractères minimum, avec une majuscule et un chiffre.</p>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enregistrement…" : "Choisir ce mot de passe"}
      </Button>
    </form>
  );
}

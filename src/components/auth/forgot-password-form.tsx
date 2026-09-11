"use client";

import { useState, useTransition } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "@/server/actions/password-reset.actions";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await requestPasswordResetAction(email);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="mt-8 rounded-md bg-sage-soft px-4 py-3 text-sm text-sage">
        Si un compte existe avec cette adresse, un email de réinitialisation vient de vous être envoyé.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Recevoir le lien de réinitialisation"}
      </Button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitContactAction } from "@/server/actions/contact.actions";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitContactAction(form);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="rounded-md bg-sage-soft px-4 py-3 text-sm text-sage">
        Merci, votre message a bien été envoyé. Notre équipe vous répondra rapidement.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="rounded-md bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom</Label>
          <Input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label htmlFor="subject">Sujet</Label>
        <Input id="subject" required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Envoi…" : "Envoyer le message"}
      </Button>
    </form>
  );
}

import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="container-page flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-muted">
          Indiquez votre adresse email, nous vous envoyons un lien pour choisir un nouveau mot de passe.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

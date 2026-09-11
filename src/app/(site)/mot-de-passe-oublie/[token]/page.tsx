import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="container-page flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-muted">Choisissez un nouveau mot de passe pour votre compte.</p>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}

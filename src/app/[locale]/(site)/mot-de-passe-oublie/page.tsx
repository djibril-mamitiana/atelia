import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.forgotPassword");
  return { title: t("title") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("Auth.forgotPassword");

  return (
    <div className="container-page flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

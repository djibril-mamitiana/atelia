import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.resetPassword");
  return { title: t("title") };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("Auth.resetPassword");

  return (
    <div className="container-page flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}

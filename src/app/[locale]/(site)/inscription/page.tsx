import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LinkButton } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.register");
  return { title: t("title") };
}

// Public sign-up is closed (professionals only): accounts are opened by our
// team from /admin/customers. This page only explains how to get one.
export default async function RegisterPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="container-page flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">{t("register.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("register.subtitle")}</p>

        <div className="mt-8 flex flex-col gap-3">
          <LinkButton href="/contact" className="w-full">{t("register.contactCta")}</LinkButton>
          <LinkButton href="/connexion" variant="ghost" className="w-full">{t("register.signIn")}</LinkButton>
        </div>
      </div>
    </div>
  );
}

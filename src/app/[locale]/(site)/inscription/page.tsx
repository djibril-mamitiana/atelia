import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.register");
  return { title: t("title") };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const t = await getTranslations("Auth");

  return (
    <div className="container-page flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">{t("register.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("register.subtitle")}</p>

        <RegisterForm nextPath={next} />

        <p className="mt-6 text-center text-sm text-muted">
          {t("register.alreadyAccount")}{" "}
          <Link href={`/connexion${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent-dark hover:underline">
            {t("register.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}

import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.login");
  return { title: t("title") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const t = await getTranslations("Auth");

  return (
    <div className="container-page flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">{t("login.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("login.subtitle")}</p>

        <LoginForm nextPath={next} />

        <p className="mt-6 text-center text-sm text-muted">
          {t("login.noAccount")}{" "}
          <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent-dark hover:underline">
            {t("login.createAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}

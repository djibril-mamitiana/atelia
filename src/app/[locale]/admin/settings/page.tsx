import { adminTitle } from "@/lib/admin-metadata";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, XCircle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProfileForm, ChangePasswordForm } from "@/components/account/profile-forms";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { isBankTransferConfigured } from "@/lib/bank";

export const generateMetadata = () => adminTitle("navSettings");

export default async function AdminSettingsPage() {
  const t = await getTranslations("Admin.Settings");
  const session = await requireRole(["ADMIN", "STAFF"]);
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  const checks = [
    { label: t("checkDb"), ok: Boolean(process.env.DATABASE_URL) },
    { label: t("checkBank"), ok: isBankTransferConfigured() },
    { label: t("checkEmail"), ok: Boolean(process.env.RESEND_API_KEY) },
    { label: t("checkStripe"), ok: Boolean(process.env.STRIPE_SECRET_KEY) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">{t("title")}</h1>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-3 font-medium text-ink">{t("siteSection")}</p>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{t("siteName")}</dt><dd className="text-ink">{SITE_NAME}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{t("siteTagline")}</dt><dd className="text-ink">{SITE_TAGLINE}</dd></div>
        </dl>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-3 font-medium text-ink">{t("configSection")}</p>
        <div className="flex flex-col gap-2">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-2 text-sm">
              {c.ok ? <CheckCircle2 size={16} className="text-sage" /> : <XCircle size={16} className="text-danger" />}
              <span className={c.ok ? "text-ink" : "text-muted"}>{c.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">{t("configHint")}</p>
      </section>

      <ProfileForm initial={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" }} />
      <ChangePasswordForm />
    </div>
  );
}

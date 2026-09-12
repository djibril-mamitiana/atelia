import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProfileForm, ChangePasswordForm } from "@/components/account/profile-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("profileTitle") };
}

export default async function ProfilePage() {
  const session = await requireUser("/compte/profil");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  const t = await getTranslations("Account");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">{t("profileTitle")}</h1>
      <ProfileForm initial={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" }} />
      <ChangePasswordForm />
    </div>
  );
}

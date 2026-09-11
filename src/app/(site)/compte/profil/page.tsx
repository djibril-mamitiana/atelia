import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProfileForm, ChangePasswordForm } from "@/components/account/profile-forms";

export const metadata: Metadata = { title: "Profil & sécurité" };

export default async function ProfilePage() {
  const session = await requireUser("/compte/profil");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Profil &amp; sécurité</h1>
      <ProfileForm initial={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" }} />
      <ChangePasswordForm />
    </div>
  );
}

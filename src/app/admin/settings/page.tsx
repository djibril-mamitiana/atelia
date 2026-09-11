import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProfileForm, ChangePasswordForm } from "@/components/account/profile-forms";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { isBankTransferConfigured } from "@/lib/bank";

export const metadata: Metadata = { title: "Paramètres — Admin" };

export default async function AdminSettingsPage() {
  const session = await requireRole(["ADMIN", "STAFF"]);
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  const checks = [
    { label: "Base de données (DATABASE_URL)", ok: Boolean(process.env.DATABASE_URL) },
    { label: "Coordonnées de virement bancaire (BANK_TRANSFER_*)", ok: isBankTransferConfigured() },
    { label: "Envoi d'emails (RESEND_API_KEY)", ok: Boolean(process.env.RESEND_API_KEY) },
    { label: "Paiement Stripe — optionnel, désactivé (STRIPE_SECRET_KEY)", ok: Boolean(process.env.STRIPE_SECRET_KEY) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Paramètres</h1>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-3 font-medium text-ink">Site</p>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Nom</dt><dd className="text-ink">{SITE_NAME}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Slogan</dt><dd className="text-ink">{SITE_TAGLINE}</dd></div>
        </dl>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-3 font-medium text-ink">État de la configuration</p>
        <div className="flex flex-col gap-2">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-2 text-sm">
              {c.ok ? <CheckCircle2 size={16} className="text-sage" /> : <XCircle size={16} className="text-danger" />}
              <span className={c.ok ? "text-ink" : "text-muted"}>{c.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Configurez les variables manquantes dans votre fichier .env (voir le README).</p>
      </section>

      <ProfileForm initial={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" }} />
      <ChangePasswordForm />
    </div>
  );
}

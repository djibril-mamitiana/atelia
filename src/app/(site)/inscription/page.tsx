import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="container-page flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Créer un compte</h1>
        <p className="mt-2 text-sm text-muted">Suivez vos commandes, gérez vos favoris et gagnez du temps au prochain achat.</p>

        <RegisterForm nextPath={next} />

        <p className="mt-6 text-center text-sm text-muted">
          Déjà un compte ?{" "}
          <Link href={`/connexion${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent-dark hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

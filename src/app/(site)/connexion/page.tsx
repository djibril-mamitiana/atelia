import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="container-page flex justify-center py-14 lg:py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Connexion</h1>
        <p className="mt-2 text-sm text-muted">Accédez à votre compte pour suivre vos commandes et vos favoris.</p>

        <LoginForm nextPath={next} />

        <p className="mt-6 text-center text-sm text-muted">
          Pas encore de compte ?{" "}
          <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent-dark hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

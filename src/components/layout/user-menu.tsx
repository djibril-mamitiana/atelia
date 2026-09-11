"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Package, MapPin, Heart, Settings, LayoutDashboard } from "lucide-react";
import { logoutAction } from "@/server/actions/auth.actions";
import { canAccessAdmin } from "@/lib/auth/roles";

export function UserMenu({
  session,
}: {
  session: { firstName: string; role: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!session) {
    return (
      <Link
        href="/connexion"
        className="flex flex-col items-center gap-0.5 text-ink-soft hover:text-ink"
        aria-label="Se connecter"
      >
        <User size={20} strokeWidth={1.6} />
        <span className="hidden text-[11px] sm:block">Compte</span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex flex-col items-center gap-0.5 text-ink-soft hover:text-ink"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User size={20} strokeWidth={1.6} />
        <span className="hidden text-[11px] sm:block">{session.firstName}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+10px)] z-40 w-60 rounded-md border border-border bg-surface py-1.5 shadow-xl">
          <p className="px-4 pb-2 pt-1 text-sm text-muted">
            Bonjour <span className="font-medium text-ink">{session.firstName}</span>
          </p>
          <MenuLink href="/compte" icon={LayoutDashboard} label="Mon compte" />
          <MenuLink href="/compte/commandes" icon={Package} label="Mes commandes" />
          <MenuLink href="/compte/favoris" icon={Heart} label="Mes favoris" />
          <MenuLink href="/compte/adresses" icon={MapPin} label="Mes adresses" />
          <MenuLink href="/compte/profil" icon={Settings} label="Profil & sécurité" />
          {canAccessAdmin(session.role) && (
            <>
              <div className="my-1.5 border-t border-border" />
              <MenuLink href="/admin" icon={LayoutDashboard} label="Back-office admin" />
            </>
          )}
          <div className="my-1.5 border-t border-border" />
          <button
            onClick={async () => {
              await logoutAction();
              setOpen(false);
              router.push("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-ink-soft hover:bg-paper"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: typeof User; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink">
      <Icon size={16} />
      {label}
    </Link>
  );
}

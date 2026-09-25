"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { User, LogOut, Package, MapPin, Heart, Settings, LayoutDashboard } from "lucide-react";
import { logoutAction } from "@/server/actions/auth.actions";
import { canAccessAdmin } from "@/lib/auth/roles";

export function UserMenu({
  session,
}: {
  session: { firstName: string; role: string } | null;
}) {
  const t = useTranslations("UserMenu");
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
        className="flex h-10 items-center gap-2 rounded-full px-3 text-ink transition-colors hover:bg-ink/5"
        aria-label={t("login")}
      >
        <User size={20} strokeWidth={1.7} />
        <span className="hidden text-sm font-medium xl:block">{t("accountLabel")}</span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-full px-3 text-ink transition-colors hover:bg-ink/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User size={20} strokeWidth={1.7} />
        <span className="hidden text-sm font-medium xl:block">{session.firstName}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-2xl border border-border bg-surface py-2 shadow-[0_30px_60px_-20px_rgba(13,15,18,0.4)]">
          <p className="px-4 pb-2 pt-1 text-sm text-muted">
            {t("greetingPrefix")} <span className="font-medium text-ink">{session.firstName}</span>
          </p>
          <MenuLink href="/compte" icon={LayoutDashboard} label={t("myAccount")} />
          <MenuLink href="/compte/commandes" icon={Package} label={t("myOrders")} />
          <MenuLink href="/compte/favoris" icon={Heart} label={t("myFavorites")} />
          <MenuLink href="/compte/adresses" icon={MapPin} label={t("myAddresses")} />
          <MenuLink href="/compte/profil" icon={Settings} label={t("profileSecurity")} />
          {canAccessAdmin(session.role) && (
            <>
              <div className="my-1.5 border-t border-border" />
              <MenuLink href="/admin" icon={LayoutDashboard} label={t("adminBackoffice")} />
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
            {t("logout")}
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

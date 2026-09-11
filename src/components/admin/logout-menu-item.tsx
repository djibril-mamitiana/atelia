"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth.actions";

export function LogoutMenuItem() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await logoutAction();
        router.push("/");
        router.refresh();
      }}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
    >
      <LogOut size={16} />
      Déconnexion
    </button>
  );
}

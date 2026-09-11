"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { toggleProductActiveAction, deleteProductAction } from "@/server/actions/admin/product.actions";

export function ProductRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await toggleProductActiveAction(id, !isActive);
      if (!result.success) toast(result.error, "error");
    });
  }

  function remove() {
    if (!confirm("Supprimer définitivement ce produit ?")) return;
    startTransition(async () => {
      const result = await deleteProductAction(id);
      toast(result.success ? "Produit supprimé." : result.error, result.success ? "success" : "error");
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={toggle} disabled={pending} className="text-xs font-medium text-accent-dark hover:underline">
        {isActive ? "Désactiver" : "Activer"}
      </button>
      <Link href={`/admin/products/${id}`} className="text-muted hover:text-ink">
        <Pencil size={15} />
      </Link>
      <button onClick={remove} disabled={pending} className="text-muted hover:text-danger">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

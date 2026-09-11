"use client";

import { useState, useTransition } from "react";
import { Select, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { adjustInventoryAction } from "@/server/actions/admin/inventory.actions";

type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "RETURN";

export function InventoryRow({
  productId,
  name,
  sku,
  stock,
  lowStockThreshold,
  isActive,
}: {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [currentStock, setCurrentStock] = useState(stock);
  const [type, setType] = useState<MovementType>("IN");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  const status = !isActive ? null : stock === 0 ? { tone: "danger" as const, label: "Rupture" } : stock <= lowStockThreshold ? { tone: "gold" as const, label: "Stock faible" } : { tone: "sage" as const, label: "En stock" };

  function submit() {
    startTransition(async () => {
      const result = await adjustInventoryAction({ productId, type, quantity, reason });
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      setCurrentStock((s) => (type === "IN" || type === "RETURN" ? s + quantity : s - quantity));
      setOpen(false);
      setReason("");
      toast("Stock mis à jour.", "success");
    });
  }

  return (
    <>
      <tr>
        <td className="px-4 py-3">
          <p className="font-medium text-ink">{name}</p>
          <p className="text-xs text-muted">{sku}</p>
        </td>
        <td className="px-4 py-3 text-ink">{currentStock}</td>
        <td className="px-4 py-3 text-muted">{lowStockThreshold}</td>
        <td className="px-4 py-3">{status && <Badge tone={status.tone}>{status.label}</Badge>}</td>
        <td className="px-4 py-3">
          <button onClick={() => setOpen((o) => !o)} className="text-xs font-medium text-accent-dark hover:underline">
            Ajuster
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} className="bg-paper px-4 py-3">
            <div className="flex flex-wrap items-end gap-3">
              <Select value={type} onChange={(e) => setType(e.target.value as MovementType)} className="w-40">
                <option value="IN">Entrée (IN)</option>
                <option value="OUT">Sortie (OUT)</option>
                <option value="ADJUSTMENT">Ajustement</option>
                <option value="RETURN">Retour</option>
              </Select>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-24" />
              <Input placeholder="Motif (optionnel)" value={reason} onChange={(e) => setReason(e.target.value)} className="flex-1" />
              <Button size="sm" onClick={submit} disabled={pending}>Valider</Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

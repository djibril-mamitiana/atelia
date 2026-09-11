"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AddressFormFields } from "@/components/checkout/address-form-fields";
import { addAddressAction, updateAddressAction, deleteAddressAction } from "@/server/actions/address.actions";
import type { AddressInput } from "@/validations/auth.schema";

type Address = AddressInput & { id: string };

const EMPTY: AddressInput = { firstName: "", lastName: "", line1: "", city: "", postalCode: "", country: "FR" };

export function AddressManager({ initialAddresses }: { initialAddresses: Address[] }) {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY);

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm(address);
    setAdding(false);
  }

  function handleAdd() {
    startTransition(async () => {
      const result = await addAddressAction(form);
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      setAddresses((prev) => [...prev, { ...form, id: result.id }]);
      setAdding(false);
      setForm(EMPTY);
      toast("Adresse ajoutée.", "success");
    });
  }

  function handleUpdate() {
    if (!editingId) return;
    startTransition(async () => {
      const result = await updateAddressAction(editingId, form);
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      setAddresses((prev) => prev.map((a) => (a.id === editingId ? { ...form, id: editingId } : a)));
      setEditingId(null);
      toast("Adresse mise à jour.", "success");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAddressAction(id);
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast("Adresse supprimée.", "success");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.map((addr) =>
        editingId === addr.id ? (
          <div key={addr.id} className="flex flex-col gap-4 rounded-md border border-ink p-4">
            <AddressFormFields value={form} onChange={setForm} />
            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={pending} size="sm">Enregistrer</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Annuler</Button>
            </div>
          </div>
        ) : (
          <div key={addr.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-4">
            <div className="text-sm">
              <p className="font-medium text-ink">
                {addr.firstName} {addr.lastName} {addr.isDefaultShipping && <Badge tone="sage" className="ml-2">Par défaut</Badge>}
              </p>
              <p className="text-muted">
                {addr.line1}, {addr.postalCode} {addr.city}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(addr)} aria-label="Modifier" className="text-muted hover:text-ink">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(addr.id)} aria-label="Supprimer" className="text-muted hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )
      )}

      {adding ? (
        <div className="flex flex-col gap-4 rounded-md border border-ink p-4">
          <AddressFormFields value={form} onChange={setForm} />
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={pending} size="sm">Ajouter</Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Annuler</Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            setForm(EMPTY);
            setAdding(true);
          }}
        >
          <Plus size={16} /> Ajouter une adresse
        </Button>
      )}
    </div>
  );
}

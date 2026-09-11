"use client";

import { Input, Label } from "@/components/ui/input";
import type { AddressInput } from "@/validations/auth.schema";

export function AddressFormFields({
  value,
  onChange,
}: {
  value: AddressInput;
  onChange: (next: AddressInput) => void;
}) {
  function set<K extends keyof AddressInput>(key: K, v: AddressInput[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label htmlFor="af-firstName">Prénom</Label>
        <Input id="af-firstName" required value={value.firstName} onChange={(e) => set("firstName", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="af-lastName">Nom</Label>
        <Input id="af-lastName" required value={value.lastName} onChange={(e) => set("lastName", e.target.value)} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="af-line1">Adresse</Label>
        <Input id="af-line1" required value={value.line1} onChange={(e) => set("line1", e.target.value)} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="af-line2">Complément (optionnel)</Label>
        <Input id="af-line2" value={value.line2 ?? ""} onChange={(e) => set("line2", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="af-postalCode">Code postal</Label>
        <Input id="af-postalCode" required value={value.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="af-city">Ville</Label>
        <Input id="af-city" required value={value.city} onChange={(e) => set("city", e.target.value)} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="af-phone">Téléphone (optionnel)</Label>
        <Input id="af-phone" type="tel" value={value.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
      </div>
    </div>
  );
}

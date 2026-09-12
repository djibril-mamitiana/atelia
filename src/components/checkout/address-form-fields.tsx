"use client";

import { useTranslations } from "next-intl";
import { Input, Label } from "@/components/ui/input";
import type { AddressInput } from "@/validations/auth.schema";

export function AddressFormFields({
  value,
  onChange,
}: {
  value: AddressInput;
  onChange: (next: AddressInput) => void;
}) {
  const t = useTranslations("Address");

  function set<K extends keyof AddressInput>(key: K, v: AddressInput[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label htmlFor="af-firstName">{t("firstName")}</Label>
        <Input id="af-firstName" required value={value.firstName} onChange={(e) => set("firstName", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="af-lastName">{t("lastName")}</Label>
        <Input id="af-lastName" required value={value.lastName} onChange={(e) => set("lastName", e.target.value)} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="af-line1">{t("line1")}</Label>
        <Input id="af-line1" required value={value.line1} onChange={(e) => set("line1", e.target.value)} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="af-line2">{t("line2Optional")}</Label>
        <Input id="af-line2" value={value.line2 ?? ""} onChange={(e) => set("line2", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="af-postalCode">{t("postalCode")}</Label>
        <Input id="af-postalCode" required value={value.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="af-city">{t("city")}</Label>
        <Input id="af-city" required value={value.city} onChange={(e) => set("city", e.target.value)} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="af-phone">{t("phoneOptional")}</Label>
        <Input id="af-phone" type="tel" value={value.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { Check, MapPin, Truck, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { computeShippingCost, type ShippingMethod } from "@/lib/shipping";
import { addAddressAction } from "@/server/actions/address.actions";
import { createOrderAction } from "@/server/actions/checkout.actions";
import { AddressFormFields } from "@/components/checkout/address-form-fields";
import type { AddressInput } from "@/validations/auth.schema";

type Address = {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  isDefaultShipping: boolean;
};

type CartLine = {
  id: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
};

const EMPTY_ADDRESS: AddressInput = {
  firstName: "",
  lastName: "",
  line1: "",
  city: "",
  postalCode: "",
  country: "FR",
};

export function CheckoutClient({
  addresses,
  lines,
  subtotal,
}: {
  addresses: Address[];
  lines: CartLine[];
  subtotal: number;
}) {
  const t = useTranslations("Checkout");
  const tCart = useTranslations("Cart");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const SHIPPING_OPTIONS: { value: ShippingMethod; label: string; description: string }[] = [
    { value: "STANDARD", label: t("shippingStandardLabel"), description: t("shippingStandardDescription") },
    { value: "EXPRESS", label: t("shippingExpressLabel"), description: t("shippingExpressDescription") },
    { value: "PICKUP", label: t("shippingPickupLabel"), description: t("shippingPickupDescription") },
  ];

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find((a) => a.isDefaultShipping)?.id ?? addresses[0]?.id ?? null
  );
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState<AddressInput>(EMPTY_ADDRESS);

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("STANDARD");
  const [couponCode, setCouponCode] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const shippingCost = useMemo(() => computeShippingCost(shippingMethod, subtotal), [shippingMethod, subtotal]);
  const estimatedTotal = subtotal + shippingCost;

  function handleSaveAddress() {
    startTransition(async () => {
      const result = await addAddressAction({ ...newAddress, isDefaultShipping: addresses.length === 0 });
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      setSelectedAddressId(result.id);
      setAddingAddress(false);
      setStep(2);
    });
  }

  function handlePay() {
    if (!selectedAddressId) {
      toast(t("chooseAddressError"), "error");
      return;
    }
    startTransition(async () => {
      const result = await createOrderAction({
        shippingAddressId: selectedAddressId,
        billingAddressId: selectedAddressId,
        shippingMethod,
        couponCode: couponCode || undefined,
        customerNote: customerNote || undefined,
      });
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      router.push(`/commande/${result.orderId}`);
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <Step number={1} active={step === 1} done={step > 1} icon={MapPin} title={t("stepAddress")} onEdit={() => setStep(1)}>
          {step === 1 && (
            <div className="flex flex-col gap-4">
              {addresses.length > 0 && !addingAddress && (
                <div className="flex flex-col gap-2.5">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 text-sm ${
                        selectedAddressId === addr.id ? "border-ink" : "border-border-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 accent-accent"
                      />
                      <span>
                        <span className="block font-medium text-ink">
                          {addr.firstName} {addr.lastName} {addr.label && <span className="text-muted">· {addr.label}</span>}
                        </span>
                        <span className="block text-muted">
                          {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}
                          {addr.postalCode} {addr.city}
                        </span>
                      </span>
                    </label>
                  ))}
                  <button onClick={() => setAddingAddress(true)} className="self-start text-sm font-medium text-accent-dark hover:underline">
                    {t("useNewAddress")}
                  </button>
                </div>
              )}

              {addingAddress && (
                <div className="flex flex-col gap-4">
                  <AddressFormFields value={newAddress} onChange={setNewAddress} />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveAddress} disabled={pending}>
                      {t("saveAddress")}
                    </Button>
                    {addresses.length > 0 && (
                      <Button variant="ghost" onClick={() => setAddingAddress(false)}>
                        {t("cancel")}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {!addingAddress && (
                <Button className="self-start" disabled={!selectedAddressId} onClick={() => setStep(2)}>
                  {t("continueBtn")}
                </Button>
              )}
            </div>
          )}
        </Step>

        <Step number={2} active={step === 2} done={step > 2} icon={Truck} title={t("stepShipping")} onEdit={() => setStep(2)}>
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                {SHIPPING_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3.5 text-sm ${
                      shippingMethod === opt.value ? "border-ink" : "border-border-strong"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethod === opt.value}
                        onChange={() => setShippingMethod(opt.value)}
                        className="accent-accent"
                      />
                      <span>
                        <span className="block font-medium text-ink">{opt.label}</span>
                        <span className="block text-muted">{opt.description}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <Button className="self-start" onClick={() => setStep(3)}>
                {t("continueBtn")}
              </Button>
            </div>
          )}
        </Step>

        <Step number={3} active={step === 3} done={false} icon={Landmark} title={t("stepPayment")} onEdit={() => setStep(3)}>
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="coupon">{t("couponOptional")}</Label>
                <Input id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
              </div>
              <div>
                <Label htmlFor="note">{t("noteOptional")}</Label>
                <Textarea id="note" rows={2} value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} />
              </div>
              <p className="text-xs text-muted">{t("bankTransferNotice")}</p>
              <Button size="lg" onClick={handlePay} disabled={pending}>
                {pending ? t("validating") : t("confirmOrder", { total: formatPrice(estimatedTotal) })}
              </Button>
            </div>
          )}
        </Step>
      </div>

      <div className="rounded-md border border-border p-5">
        <p className="mb-4 font-medium text-ink">{t("orderSummary")}</p>
        <div className="flex flex-col gap-3">
          {lines.map((line) => (
            <div key={line.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-paper">
                {line.imageUrl && <Image src={line.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{line.name}</p>
                <p className="text-xs text-muted">{tCart("quantity", { quantity: line.quantity })}</p>
              </div>
              <span className="text-sm font-medium text-ink">{formatPrice(line.unitPrice * line.quantity)}</span>
            </div>
          ))}
        </div>

        <dl className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t("subtotal")}</dt>
            <dd className="text-ink">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("shipping")}</dt>
            <dd className="text-ink">{shippingCost === 0 ? tCart("free") : formatPrice(shippingCost)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-ink">
            <dt>{t("estimatedTotal")}</dt>
            <dd>{formatPrice(estimatedTotal)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function Step({
  number,
  active,
  done,
  icon: Icon,
  title,
  onEdit,
  children,
}: {
  number: number;
  active: boolean;
  done: boolean;
  icon: typeof MapPin;
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-md border p-5 ${active ? "border-ink" : "border-border"}`}>
      <button onClick={onEdit} className="flex w-full items-center gap-3 text-left" disabled={!done && !active}>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
            done ? "bg-sage text-white" : active ? "bg-ink text-white" : "bg-paper text-muted"
          }`}
        >
          {done ? <Check size={14} /> : number}
        </span>
        <Icon size={17} className="text-ink-soft" />
        <span className="font-medium text-ink">{title}</span>
      </button>
      {(active || done) && <div className="mt-4">{children}</div>}
    </div>
  );
}

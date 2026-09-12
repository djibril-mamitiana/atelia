import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AddressManager } from "@/components/account/address-manager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("addressesTitle") };
}

export default async function AddressesPage() {
  const session = await requireUser("/compte/adresses");
  const addresses = await db.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
  });
  const t = await getTranslations("Account");

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("addressesTitle")}</h1>
      <div className="mt-6">
        <AddressManager
          initialAddresses={addresses.map((a) => ({
            id: a.id,
            label: a.label ?? undefined,
            firstName: a.firstName,
            lastName: a.lastName,
            company: a.company ?? undefined,
            line1: a.line1,
            line2: a.line2 ?? undefined,
            city: a.city,
            postalCode: a.postalCode,
            country: a.country,
            phone: a.phone ?? undefined,
            isDefaultShipping: a.isDefaultShipping,
            isDefaultBilling: a.isDefaultBilling,
          }))}
        />
      </div>
    </div>
  );
}

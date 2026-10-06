import { getTranslations } from "next-intl/server";
import { adminTitle } from "@/lib/admin-metadata";
import { generateCustomerCode } from "@/lib/auth/customer-code";
import { CustomerForm } from "@/components/admin/customer-form";

export const generateMetadata = () => adminTitle("navCustomers");

export default async function NewCustomerPage() {
  const t = await getTranslations("Admin.CustomerForm");

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("newTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("newSubtitle")}</p>
      <div className="mt-6 max-w-2xl">
        <CustomerForm
          initial={{ firstName: "", lastName: "", company: "", email: "", phone: "", customerCode: generateCustomerCode(), isActive: true }}
        />
      </div>
    </div>
  );
}

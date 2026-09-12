import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, Phone, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return { title: t("title") };
}

export default async function ContactPage() {
  const t = await getTranslations("Contact");

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">{t("title")}</h1>
      <p className="mt-1.5 max-w-xl text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ContactForm />

        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <Mail size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">{t("byEmail")}</p>
              <p className="text-sm text-muted">support@atelia.example</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">{t("byPhone")}</p>
              <p className="text-sm text-muted">01 23 45 67 89</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">{t("hours")}</p>
              <p className="text-sm text-muted">{t("hoursValue")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

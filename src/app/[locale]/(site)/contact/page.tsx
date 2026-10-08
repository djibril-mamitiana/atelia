import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, Phone, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { getSiteSettings } from "@/server/services/site-settings";
import { telHref } from "@/lib/contact";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return { title: t("title") };
}

export default async function ContactPage() {
  const [t, settings] = await Promise.all([getTranslations("Contact"), getSiteSettings()]);

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
              <a href={`mailto:${settings.contactEmail}`} className="text-sm text-muted hover:text-accent-dark">{settings.contactEmail}</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">{t("byPhone")}</p>
              <a href={telHref(settings.contactPhone)} className="text-sm text-muted hover:text-accent-dark">{settings.contactPhone}</a>
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

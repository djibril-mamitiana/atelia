import type { Metadata } from "next";
import { Mail, Phone, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">Contact</h1>
      <p className="mt-1.5 max-w-xl text-sm text-muted">
        Une question sur un produit, une commande ou un projet en cours ? Notre équipe vous répond.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ContactForm />

        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <Mail size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">Par email</p>
              <p className="text-sm text-muted">support@atelia.example</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">Par téléphone</p>
              <p className="text-sm text-muted">01 23 45 67 89</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">Horaires</p>
              <p className="text-sm text-muted">Du lundi au samedi, 9h–19h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

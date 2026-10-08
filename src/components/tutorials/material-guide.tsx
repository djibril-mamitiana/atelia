import { getTranslations } from "next-intl/server";
import { Lightbulb, Phone } from "lucide-react";
import { getSiteSettings } from "@/server/services/site-settings";
import { telHref } from "@/lib/contact";

// Rows of the "which blade / which core bit for which material" tip. The
// wording lives in messages/*.json (MaterialGuide.rows.<key>).
const ROWS = ["reinforcedConcrete", "abrasive", "hardStone", "tile", "masonry", "softStone"] as const;
const RULES = ["ruleHard", "ruleAbrasive", "ruleWet"] as const;

/** General guidance, not a per-product spec — ends with a call-us prompt. */
export async function MaterialGuide() {
  const [t, settings] = await Promise.all([getTranslations("MaterialGuide"), getSiteSettings()]);

  return (
    <section id="astuce" className="scroll-mt-28 rounded-3xl border border-border bg-surface p-5 sm:p-7">
      <p className="eyebrow flex items-center gap-2 text-accent-dark">
        <Lightbulb size={15} /> {t("eyebrow")}
      </p>
      <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">{t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t("intro")}</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t("colMaterial")}</th>
              <th className="px-4 py-3 font-medium">{t("colBlade")}</th>
              <th className="px-4 py-3 font-medium">{t("colCoreBit")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map((row) => (
              <tr key={row} className="align-top">
                <th scope="row" className="px-4 py-3 font-medium text-ink">{t(`rows.${row}.material`)}</th>
                <td className="px-4 py-3 text-ink-soft">{t(`rows.${row}.blade`)}</td>
                <td className="px-4 py-3 text-ink-soft">{t(`rows.${row}.coreBit`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-5 grid gap-3 text-sm text-ink-soft sm:grid-cols-3">
        {RULES.map((rule) => (
          <li key={rule} className="rounded-2xl bg-paper p-4">{t(rule)}</li>
        ))}
      </ul>

      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink">
        <Phone size={15} className="text-accent-dark" />
        {t("callUs")}
        <a href={telHref(settings.contactPhone)} className="font-medium text-accent-dark hover:underline">
          {settings.contactPhone}
        </a>
      </p>
    </section>
  );
}

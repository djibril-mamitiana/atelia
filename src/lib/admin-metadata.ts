import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/** Browser-tab title for an admin page, in the visitor's language: "<section> — Admin". */
export async function adminTitle(navKey: string): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return { title: `${t(navKey)} — Admin` };
}

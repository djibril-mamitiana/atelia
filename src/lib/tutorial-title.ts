type TitleFields = {
  title: string;
  titleDe?: string | null;
  titleEn?: string | null;
  titleIt?: string | null;
};

/**
 * Tutorial.title is the French source-catalogue title; titleDe/titleEn/titleIt
 * are the translations (see the schema, same source language as Category).
 * Used for read-only admin displays (list rows, edit-page headings, linked
 * product references) — the editable title field itself stays French, since
 * the tutorial form has no per-language tabs.
 */
export function localizedTutorialTitle(t: TitleFields, locale: string): string {
  if (locale === "de") return t.titleDe ?? t.title;
  if (locale === "en") return t.titleEn ?? t.title;
  if (locale === "it") return t.titleIt ?? t.title;
  return t.title;
}

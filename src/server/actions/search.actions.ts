"use server";

import { searchAll } from "@/server/queries/catalog.queries";

export async function searchSuggestionsAction(query: string) {
  return searchAll(query);
}

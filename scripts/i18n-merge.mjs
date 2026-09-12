// Deep-merges namespace objects into messages/{locale}.json. Used as a
// throwaway helper while translating page-by-page — pass a JS module (via
// --data) exporting { fr, de, en, it } namespace objects to merge in.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object"
    ) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const dataPath = process.argv[2];
if (!dataPath) {
  console.error("Usage: node scripts/i18n-merge.mjs <path-to-data.mjs>");
  process.exit(1);
}

const fileUrl = pathToFileURL(process.cwd() + "/" + dataPath).href + `?t=${Date.now()}`;
const { default: data } = await import(fileUrl);

for (const locale of ["fr", "de", "en", "it"]) {
  if (!data[locale]) continue;
  const path = `messages/${locale}.json`;
  const current = JSON.parse(readFileSync(path, "utf8"));
  deepMerge(current, data[locale]);
  writeFileSync(path, JSON.stringify(current, null, 2) + "\n");
  console.log(`merged into ${path}`);
}

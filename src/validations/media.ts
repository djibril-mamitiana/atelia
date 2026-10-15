import { z } from "zod";

/**
 * Address of a photo or video: a full http(s) link, or a file served by the
 * site itself ("/products/hualing/x.webp" — how every catalogue photo is
 * stored). z.string().url() alone rejects the latter.
 */
export const mediaUrlSchema = z
  .string()
  .trim()
  .refine((v) => /^https?:\/\/\S+$/i.test(v) || /^\/[^/\s]\S*$/.test(v), "Adresse invalide : un lien https://… ou un chemin /…");

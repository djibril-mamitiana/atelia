import "server-only";
import sharp from "sharp";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/media";

/** Longest side kept for uploaded photos: plenty for a zoomed product photo. */
const MAX_SIDE = 2000;

export class MediaError extends Error {}

/**
 * Stores an uploaded photo: straightened (EXIF orientation), shrunk to
 * MAX_SIDE, converted to WebP, metadata stripped. Rejects anything sharp
 * can't decode as an image. Returns its public address.
 */
export async function storeUploadedImage(input: Buffer, { originalName, userId }: { originalName?: string; userId?: string }) {
  const output = await sharp(input, { failOn: "error" })
    .rotate()
    .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new MediaError("Format d'image non reconnu : envoyez une photo JPEG, PNG ou WebP.");
    });
  const file = await db.mediaFile.create({
    data: {
      data: new Uint8Array(output.data),
      contentType: "image/webp",
      width: output.info.width,
      height: output.info.height,
      size: output.info.size,
      originalName: originalName?.slice(0, 200) || null,
      uploadedById: userId ?? null,
    },
    select: { id: true, width: true, height: true },
  });
  return { url: mediaUrl(file.id), width: file.width, height: file.height };
}

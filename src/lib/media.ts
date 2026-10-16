// Address of a photo uploaded from the admin (stored in the MediaFile table,
// served by app/media/[file]/route.ts). Shared by server and admin UI.

export const MEDIA_MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function mediaUrl(id: string): string {
  return `/media/${id}.webp`;
}

/** "ckxyz….webp" → "ckxyz…" (the MediaFile id), or null for anything else. */
export function mediaIdFromFileName(fileName: string): string | null {
  return fileName.match(/^([a-z0-9]{20,40})\.webp$/)?.[1] ?? null;
}

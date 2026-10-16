import { db } from "@/lib/db";
import { mediaIdFromFileName } from "@/lib/media";

/** Serves a photo uploaded from the admin: /media/<id>.webp. A file never
 *  changes once stored (a new upload gets a new id), so it is cached for good. */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = mediaIdFromFileName(file);
  const media = id ? await db.mediaFile.findUnique({ where: { id }, select: { data: true, contentType: true } }) : null;
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.contentType,
      "Content-Length": String(media.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

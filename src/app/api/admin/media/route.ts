import { getSession } from "@/lib/auth/session";
import { MEDIA_MAX_UPLOAD_BYTES } from "@/lib/media";
import { MediaError, storeUploadedImage } from "@/server/services/media";

/**
 * Photo upload from the admin (product photos, category galleries): one
 * file per request, field "file". Staff only. Answers { url } — the address
 * to put in the product / category, e.g. "/media/ck….webp".
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return Response.json({ error: "Réservé à l'équipe : reconnectez-vous." }, { status: 401 });
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MEDIA_MAX_UPLOAD_BYTES + 1024 * 1024) {
    return Response.json({ error: "Photo trop lourde (20 Mo maximum)." }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return Response.json({ error: "Envoi invalide." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Aucune photo reçue." }, { status: 400 });
  if (file.size > MEDIA_MAX_UPLOAD_BYTES) return Response.json({ error: "Photo trop lourde (20 Mo maximum)." }, { status: 413 });

  try {
    const stored = await storeUploadedImage(Buffer.from(await file.arrayBuffer()), { originalName: file.name, userId: session.userId });
    return Response.json(stored, { status: 201 });
  } catch (err) {
    if (err instanceof MediaError) return Response.json({ error: err.message }, { status: 415 });
    throw err;
  }
}

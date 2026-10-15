// Videos are stored as plain URLs: a YouTube link (watch, youtu.be, Shorts,
// embed) or the address of a video file (.mp4…). YouTube links are shown in
// the YouTube player, anything else in the browser's own <video> player.

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com"]);
const ID = /^[\w-]{11}$/;

/** The 11-character YouTube video id of a link, or null when it isn't one. */
export function youtubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(parsed.hostname)) return null;
  const candidate =
    parsed.hostname === "youtu.be"
      ? parsed.pathname.slice(1)
      : (parsed.searchParams.get("v") ?? parsed.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? "");
  return ID.test(candidate) ? candidate : null;
}

/** Shorts are filmed upright: they are framed in portrait. */
export function isYoutubeShort(url: string): boolean {
  return youtubeId(url) !== null && /\/shorts\//.test(url);
}

export function youtubeEmbedUrl(id: string, { autoplay = false }: { autoplay?: boolean } = {}): string {
  // nocookie: no YouTube tracking cookie until the visitor presses play.
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

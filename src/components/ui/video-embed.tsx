import { cn } from "@/lib/utils";
import { isYoutubeShort, youtubeEmbedUrl, youtubeId } from "@/lib/video";

/**
 * A stored video URL, played in place: the YouTube player for YouTube links
 * (Shorts framed upright), the browser's player for a video file.
 */
export function VideoEmbed({
  url,
  title,
  poster,
  autoplay = false,
  className,
}: {
  url: string;
  title: string;
  poster?: string | null;
  autoplay?: boolean;
  className?: string;
}) {
  const id = youtubeId(url);
  if (!id) {
    return (
      <div className={cn("aspect-video overflow-hidden rounded-md bg-ink", className)}>
        <video src={url} controls autoPlay={autoplay} poster={poster ?? undefined} className="h-full w-full object-cover" />
      </div>
    );
  }
  const short = isYoutubeShort(url);
  return (
    <div className={cn("overflow-hidden rounded-md bg-ink", short ? "flex aspect-video justify-center" : "aspect-video", className)}>
      <iframe
        src={youtubeEmbedUrl(id, { autoplay })}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
        className={short ? "aspect-[9/16] h-full" : "h-full w-full"}
      />
    </div>
  );
}

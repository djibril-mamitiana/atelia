"use client";

import { useState } from "react";
import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { youtubeId, youtubeThumbnail } from "@/lib/video";
import { VideoEmbed } from "@/components/ui/video-embed";

type Media = { type: "image" | "video"; url: string; alt?: string | null };

export function ProductGallery({ media, productName }: { media: Media[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex] ?? media[0];

  if (!active) {
    return <div className="aspect-square w-full rounded-3xl bg-paper" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-surface border border-border">
        {active.type === "video" ? (
          <div className="flex h-full w-full items-center bg-ink">
            {/* Opened by a click on its thumbnail: start playing right away. */}
            <VideoEmbed url={active.url} title={active.alt || productName} autoplay className="h-full w-full rounded-none" />
          </div>
        ) : (
          <Image src={active.url} alt={active.alt ?? productName} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" priority />
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {media.map((m, i) => {
            const ytId = m.type === "video" ? youtubeId(m.url) : null;
            return (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={m.type === "video" ? (m.alt || productName) : undefined}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2",
                  i === activeIndex ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                {m.type === "video" ? (
                  <div className="flex h-full w-full items-center justify-center bg-ink/80">
                    {ytId && <Image src={youtubeThumbnail(ytId)} alt="" fill sizes="64px" className="object-cover opacity-70" />}
                    <PlayCircle size={22} className="relative text-white" />
                  </div>
                ) : (
                  <Image src={m.url} alt="" fill sizes="64px" className="object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

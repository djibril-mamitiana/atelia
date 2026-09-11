"use client";

import { useState } from "react";
import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Media = { type: "image" | "video"; url: string; alt?: string | null };

export function ProductGallery({ media, productName }: { media: Media[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex] ?? media[0];

  if (!active) {
    return <div className="aspect-square w-full rounded-md bg-paper" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-paper">
        {active.type === "video" ? (
          <video src={active.url} controls className="h-full w-full object-cover" />
        ) : (
          <Image src={active.url} alt={active.alt ?? productName} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" priority />
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border",
                i === activeIndex ? "border-accent" : "border-border"
              )}
            >
              {m.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-ink/80">
                  <PlayCircle size={20} className="text-white" />
                </div>
              ) : (
                <Image src={m.url} alt="" fill sizes="64px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

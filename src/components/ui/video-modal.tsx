"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isYoutubeShort } from "@/lib/video";
import { VideoEmbed } from "@/components/ui/video-embed";

/** A video playing full-screen over the page; Escape, the cross or a click outside closes it. */
export function VideoModal({
  url,
  title,
  closeLabel,
  onClose,
  children,
}: {
  url: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const short = isYoutubeShort(url);
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className={cn("relative flex flex-col items-center gap-4", short ? "h-[80vh]" : "w-full max-w-4xl")}>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X size={20} />
        </button>
        <VideoEmbed url={url} title={title} autoplay className={short ? "aspect-[9/16] h-full max-w-[90vw]" : "w-full"} />
        {children}
      </div>
    </div>,
    document.body
  );
}

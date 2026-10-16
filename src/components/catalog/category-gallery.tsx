"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** The category's photos (set in the admin); a click opens them full screen. */
export function CategoryGallery({ images, name }: { images: string[]; name: string }) {
  const t = useTranslations("Catalog");
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-display text-2xl text-ink">{t("galleryTitle")}</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={t("galleryOpen", { index: i + 1, total: images.length })}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-paper"
          >
            <Image
              src={url}
              alt={t("galleryAlt", { name, index: i + 1 })}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
      {open !== null && <Lightbox images={images} name={name} index={open} onIndex={setOpen} onClose={close} />}
    </section>
  );
}

function Lightbox({
  images,
  name,
  index,
  onIndex,
  onClose,
}: {
  images: string[];
  name: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("Catalog");
  const closeRef = useRef<HTMLButtonElement>(null);
  const go = useCallback((step: number) => onIndex((index + step + images.length) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  const arrow = "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25";
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={name} onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative h-[80vh] w-full max-w-5xl">
        <Image src={images[index]} alt={t("galleryAlt", { name, index: index + 1 })} fill sizes="100vw" className="object-contain" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t("galleryPrev")} className={cn(arrow, "left-2")}>
              <ChevronLeft size={24} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t("galleryNext")} className={cn(arrow, "right-2")}>
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t("galleryClose")}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25"
      >
        <X size={20} />
      </button>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/70">
        {index + 1} / {images.length}
      </p>
    </div>,
    document.body
  );
}

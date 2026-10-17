"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Leaf, Play } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { VideoModal } from "@/components/ui/video-modal";

/**
 * Hero visual: the two cans of concrete cleaner (5 L, 20 L). A click plays
 * the cleaner's video (the category's video, set in the admin).
 */
export function HeroCleaner({ videoUrl, productHref }: { videoUrl: string; productHref: string | null }) {
  const t = useTranslations("Home");
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const card =
    "absolute overflow-hidden rounded-[28px] bg-[#c9c9cb] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition-transform duration-700 ease-out";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t("heroCleanerPlay")} className="group relative block aspect-square w-full cursor-pointer">
        <span className={`${card} left-[3%] top-[3%] w-[52%] -rotate-[5deg] group-hover:-rotate-[7deg]`}>
          <Image src="/home/decap-beton-20l.webp" alt={t("heroCleanerAlt20")} width={750} height={1000} sizes="(min-width: 1024px) 22vw, 48vw" className="h-auto w-full" priority />
        </span>
        <span className={`${card} bottom-[3%] right-[3%] w-[50%] rotate-[4deg] group-hover:rotate-[6deg]`}>
          <Image src="/home/decap-beton-5l.webp" alt={t("heroCleanerAlt5")} width={750} height={1000} sizes="(min-width: 1024px) 22vw, 48vw" className="h-auto w-full" priority />
        </span>

        <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-graphite ring-[10px] ring-accent/25 transition-transform duration-300 group-hover:scale-110 sm:h-24 sm:w-24">
          <Play size={32} fill="currentColor" className="ml-1" />
        </span>

        {/* "Biodégradable" sits right above the product line. */}
        <span className="absolute bottom-[6%] left-0 flex flex-col items-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3.5 py-2 text-[12.5px] font-semibold text-sage shadow-lg">
            <Leaf size={14} strokeWidth={2.4} />
            {t("heroCleanerBadge")}
          </span>
          <span className="rounded-full border border-white/15 bg-graphite/85 px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/90 backdrop-blur">
            {t("heroCleanerChip")}
          </span>
        </span>
      </button>

      {open && (
        <VideoModal url={videoUrl} title={t("heroCleanerPlay")} closeLabel={t("videoClose")} onClose={close}>
          {productHref && (
            <LinkButton href={productHref} variant="light" onClick={close}>
              {t("heroCleanerProduct")}
            </LinkButton>
          )}
        </VideoModal>
      )}
    </>
  );
}

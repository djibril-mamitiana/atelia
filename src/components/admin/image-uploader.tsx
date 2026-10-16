"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MEDIA_MAX_UPLOAD_BYTES } from "@/lib/media";

/** Phone photos are shrunk in the browser first: faster on a slow connection. */
const BROWSER_MAX_SIDE = 2400;

async function shrinkForUpload(file: File): Promise<Blob> {
  // PNGs may be transparent (JPEG would turn that black); small files go as is.
  if (file.type === "image/png" || file.size < 1.5 * 1024 * 1024 || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, BROWSER_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return blob ?? file;
  } catch {
    return file; // e.g. HEIC outside Safari: let the server answer.
  }
}

/**
 * Photo list of a product or category: upload from the computer or phone
 * (drag & drop or file picker), reorder, remove, or paste an address.
 * The first photo is the main one.
 */
export function ImageUploader({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const t = useTranslations("Admin.Uploader");
  const inputRef = useRef<HTMLInputElement>(null);
  // Uploads finish one by one: append to the latest list, not the one at click time.
  const latest = useRef(value);
  latest.current = value;
  const [pending, setPending] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [address, setAddress] = useState("");

  const update = (urls: string[]) => {
    latest.current = urls;
    onChange(urls);
  };

  async function upload(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (images.length === 0) return;
    setErrors([]);
    setPending((n) => n + images.length);
    for (const file of images) {
      try {
        if (file.size > MEDIA_MAX_UPLOAD_BYTES) throw new Error(t("tooBig"));
        const body = new FormData();
        body.append("file", await shrinkForUpload(file), file.name);
        const res = await fetch("/api/admin/media", { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !json.url) throw new Error(json.error || t("failed"));
        update([...latest.current, json.url]);
      } catch (err) {
        setErrors((list) => [...list, `${file.name} : ${err instanceof Error ? err.message : t("failed")}`]);
      } finally {
        setPending((n) => n - 1);
      }
    }
  }

  function move(index: number, step: -1 | 1) {
    const next = [...value];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    update(next);
  }

  function addAddress() {
    const url = address.trim();
    if (!url) return;
    update([...value, url]);
    setAddress("");
  }

  const iconButton = "flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white disabled:opacity-30";

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(Array.from(e.dataTransfer.files));
        }}
        className={cn("rounded-md border-2 border-dashed p-3 transition-colors", dragging ? "border-accent bg-accent-soft" : "border-border-strong")}
      >
        <div className="flex flex-wrap gap-3">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="relative h-28 w-28 overflow-hidden rounded-md border border-border bg-paper">
              <Image src={url} alt="" fill sizes="112px" unoptimized className="object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-white">{t("main")}</span>}
              <button type="button" onClick={() => update(value.filter((_, j) => j !== i))} aria-label={t("remove")} className={cn(iconButton, "absolute right-1 top-1")}>
                <X size={13} />
              </button>
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("moveBefore")} className={iconButton}>
                  <ChevronLeft size={14} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={t("moveAfter")} className={iconButton}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
          {Array.from({ length: pending }, (_, i) => (
            <div key={`pending-${i}`} className="flex h-28 w-28 items-center justify-center rounded-md border border-border bg-paper text-muted">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-md border border-border-strong text-xs font-medium text-ink-soft hover:border-accent hover:text-accent-dark"
          >
            <ImagePlus size={22} />
            {t("add")}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">{t("hint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          hidden
          onChange={(e) => {
            void upload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {errors.length > 0 && (
        <ul className="rounded-md bg-danger-soft px-3.5 py-2.5 text-xs text-danger">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addAddress();
            }
          }}
          placeholder={t("addressPlaceholder")}
        />
        <Button type="button" variant="outline" size="sm" onClick={addAddress} className="h-11 shrink-0">
          {t("addAddress")}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Sticky bar that gains a hairline + soft shadow once the page scrolls. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-paper/95 backdrop-blur-xl transition-[border-color,box-shadow] duration-300",
        scrolled ? "border-border shadow-[0_8px_30px_-18px_rgba(13,15,18,0.35)]" : "border-transparent"
      )}
    >
      {children}
    </header>
  );
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll-reveal driver. Elements opt in with `data-reveal` (optionally
 * `data-reveal-delay="120"` in ms). Content stays fully visible until this
 * component is running: anything already on screen is marked visible
 * *before* `.reveal-ready` is switched on, so there is never a flash, and
 * everything below the fold fades/rises in as it enters the viewport.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (nodes.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }

    for (const node of nodes) {
      const delay = node.dataset.revealDelay;
      if (delay) node.style.setProperty("--reveal-delay", `${delay}ms`);
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) node.classList.add("is-in");
    }
    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    nodes.filter((n) => !n.classList.contains("is-in")).forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

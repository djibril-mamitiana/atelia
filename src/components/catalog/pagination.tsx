import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1
  );

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`flex h-9 w-9 items-center justify-center rounded-md border border-border-strong ${
          page === 1 ? "pointer-events-none opacity-40" : "hover:bg-paper"
        }`}
      >
        <ChevronLeft size={16} />
      </Link>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1.5 text-muted">…</span>}
          <Link
            href={hrefFor(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-md text-sm ${
              p === page ? "bg-ink text-white" : "border border-border-strong hover:bg-paper"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}

      <Link
        href={hrefFor(Math.min(pageCount, page + 1))}
        aria-disabled={page === pageCount}
        className={`flex h-9 w-9 items-center justify-center rounded-md border border-border-strong ${
          page === pageCount ? "pointer-events-none opacity-40" : "hover:bg-paper"
        }`}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}

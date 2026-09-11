import { formatPrice } from "@/lib/format";

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex h-48 items-end gap-1.5">
      {data.map((d) => (
        <div key={d.label} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
          <div className="pointer-events-none absolute bottom-full mb-1.5 hidden whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-xs text-white group-hover:block">
            {formatPrice(d.value)}
          </div>
          <div
            className="w-full rounded-t-sm bg-accent/80 transition-colors group-hover:bg-accent"
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
          />
          <span className="text-[10px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

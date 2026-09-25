import { cn } from "@/lib/utils";

const SEGMENTS = 28;
const SLOTS = 14;

// Sparks thrown off the cutting edge: [x, y offset from the contact point,
// travel x, travel y, delay, length]. Purely decorative, hidden when the
// visitor prefers reduced motion.
const SPARKS: [number, number, number, number, number][] = [
  [0, 0, 70, -46, 0],
  [6, 8, 88, -14, 0.35],
  [-4, -6, 58, -78, 0.7],
  [10, 2, 104, -32, 1.05],
  [2, 12, 76, 8, 1.4],
  [-6, 4, 50, -60, 1.75],
  [8, -8, 96, -70, 2.1],
];

/**
 * Hero illustration: a segmented, laser-slotted diamond blade drawn in SVG
 * (no photography — the catalogue images are placeholders), turning very
 * slowly, with a warm glow and a few sparks at the cutting edge.
 */
export function Blade({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 600"
      role="img"
      aria-label="Diamond blade"
      className={cn("h-full w-full overflow-visible", className)}
    >
      <defs>
        <radialGradient id="blade-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ff5a1f" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="blade-body" cx="42%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#323843" />
          <stop offset="60%" stopColor="#1a1e25" />
          <stop offset="100%" stopColor="#0f1216" />
        </radialGradient>
        <linearGradient id="blade-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef0f4" />
          <stop offset="45%" stopColor="#b3b9c4" />
          <stop offset="100%" stopColor="#6d7480" />
        </linearGradient>
        <linearGradient id="blade-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <path id="blade-ring-text" d="M300,300 m-247,0 a247,247 0 1,1 494,0 a247,247 0 1,1 -494,0" fill="none" />
      </defs>

      <circle cx="430" cy="190" r="330" fill="url(#blade-glow)" className="glow-breathe" />

      <g className="blade-spin">
        <circle cx="300" cy="300" r="270" fill="url(#blade-body)" stroke="#3b414b" strokeWidth="1.5" />

        {Array.from({ length: SEGMENTS }, (_, i) => (
          <g key={i} transform={`rotate(${(i * 360) / SEGMENTS} 300 300)`}>
            <rect x="274" y="8" width="52" height="31" rx="4.5" fill="url(#blade-rim)" />
            <rect x="274" y="8" width="52" height="3" rx="1.5" fill="#fff" opacity="0.55" />
            <rect x="274" y="35" width="52" height="4" rx="2" fill="#000" opacity="0.18" />
          </g>
        ))}

        <circle cx="300" cy="300" r="258" fill="none" stroke="#2c323b" strokeWidth="1" />
        <circle cx="300" cy="300" r="204" fill="none" stroke="#2c323b" strokeWidth="1" />
        <circle cx="300" cy="300" r="132" fill="none" stroke="#39404a" strokeWidth="1" strokeDasharray="2 7" />

        {Array.from({ length: SLOTS }, (_, i) => (
          <rect
            key={i}
            x="295.5"
            y="60"
            width="9"
            height="38"
            rx="4.5"
            fill="#080a0d"
            stroke="#2e343d"
            strokeWidth="1"
            transform={`rotate(${(i * 360) / SLOTS + 360 / SLOTS / 2} 300 300)`}
          />
        ))}

        <text fontFamily="var(--font-geist-mono), monospace" fontSize="11" letterSpacing="5" fill="#7f8792">
          <textPath href="#blade-ring-text" startOffset="0">
            DIAMOND PRO — Ø230 × 22,2 — SEGMENTED — DIAMOND PRO — Ø230 × 22,2 — SEGMENTED —
          </textPath>
        </text>

        <circle cx="300" cy="300" r="74" fill="#171b21" stroke="#3b414b" strokeWidth="1.5" />
        <circle cx="300" cy="300" r="60" fill="none" stroke="#2c323b" strokeWidth="1" />
        <circle cx="300" cy="300" r="30" fill="#07080a" stroke="#8d949f" strokeWidth="2" />
        <circle cx="300" cy="300" r="6" fill="var(--color-accent)" />
      </g>

      <circle cx="300" cy="300" r="292" fill="url(#blade-sheen)" pointerEvents="none" />

      <g transform="translate(508 132)">
        {SPARKS.map(([x, y, sx, sy, delay], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <line
              className="spark"
              x1="0"
              y1="0"
              x2="20"
              y2="-7"
              stroke={i % 2 ? "#ffb98f" : "#ff5a1f"}
              strokeWidth="2.6"
              strokeLinecap="round"
              style={{ ["--sx" as string]: `${sx}px`, ["--sy" as string]: `${sy}px`, ["--sd" as string]: `${delay}s` }}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

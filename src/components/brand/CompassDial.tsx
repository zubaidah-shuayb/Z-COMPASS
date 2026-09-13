import { cn } from "@/lib/utils";

/**
 * A quiet compass-inspired visual: concentric rings, cardinal ticks and a
 * needle. Used sparingly as an ambient element, never as a loud icon.
 */
export function CompassDial({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none relative aspect-square", className)} aria-hidden="true">
      <svg viewBox="0 0 400 400" className="size-full animate-slow-spin">
        <defs>
          <linearGradient id="zc-dial" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--lavender)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <circle
          cx="200"
          cy="200"
          r="178"
          fill="none"
          stroke="url(#zc-dial)"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
        <circle
          cx="200"
          cy="200"
          r="132"
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="1"
          strokeDasharray="3 10"
        />
        {[0, 90, 180, 270].map((angle) => (
          <line
            key={angle}
            x1="200"
            y1="14"
            x2="200"
            y2="48"
            stroke="url(#zc-dial)"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${angle} 200 200)`}
          />
        ))}
        {[30, 60, 120, 150, 210, 240, 300, 330].map((angle) => (
          <line
            key={angle}
            x1="200"
            y1="18"
            x2="200"
            y2="32"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${angle} 200 200)`}
          />
        ))}
      </svg>
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 size-full animate-pulse-soft"
        style={{ animationDuration: "6s" }}
      >
        <path
          d="M200 92 L232 208 L200 188 L168 208 Z"
          fill="url(#zc-dial)"
          opacity="0.95"
        />
        <path d="M200 308 L168 192 L200 212 L232 192 Z" fill="var(--lavender)" opacity="0.35" />
        <circle cx="200" cy="200" r="6" fill="var(--primary)" />
      </svg>
    </div>
  );
}

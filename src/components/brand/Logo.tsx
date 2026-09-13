import { cn } from "@/lib/utils";
import logoAsset from "@/assets/z-compass-logo.png";

type LogoProps = {
  /** "mark" shows the compass icon only, "full" adds the wordmark. */
  variant?: "mark" | "full";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const markSize = {
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
} as const;

const wordSize = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
} as const;

/**
 * The official Z-COMPASS mark, used unmodified. The source artwork sits on a
 * black plate, so the mark is cropped to its icon area via object positioning.
 */
export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl bg-black shadow-glow",
          markSize[size],
        )}
      >
        <img
          src={logoAsset}
          alt="Z-COMPASS"
          className="absolute left-1/2 top-1/2 h-[176%] w-[176%] max-w-none object-contain"
          style={{ transform: "translate(-49.8%, -42.3%)" }}
          loading="eager"
          decoding="async"
        />
      </span>
      {variant === "full" && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display font-semibold tracking-[0.22em]", wordSize[size])}>
            <span className="text-gradient-brand">Z</span>
            <span className="text-foreground">-COMPASS</span>
          </span>
          {size === "lg" && (
            <span className="mt-2 text-[0.625rem] uppercase tracking-wordmark text-muted-foreground">
              Clarity · Decisions · Progress
            </span>
          )}
        </span>
      )}
    </span>
  );
}

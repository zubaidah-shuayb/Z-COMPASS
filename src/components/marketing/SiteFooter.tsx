import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/brand/Logo";
import { SUPPORT_EMAIL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo variant="full" size="sm" />
          <p className="mt-4 text-sm text-muted-foreground">
            A personal compass for thinking clearly, choosing a direction and moving forward.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <span className="text-xs uppercase tracking-wordmark text-muted-foreground">Product</span>
          <Link to="/how-it-works" className="text-foreground/80 transition-colors hover:text-foreground">
            How it works
          </Link>
          <Link to="/support" className="text-foreground/80 transition-colors hover:text-foreground">
            Support
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <span className="text-xs uppercase tracking-wordmark text-muted-foreground">Contact</span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-foreground/80 transition-colors hover:text-foreground"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        Z-COMPASS — part of the ZEEAYB ecosystem. The compass provides direction; you choose the
        path.
      </div>
    </footer>
  );
}

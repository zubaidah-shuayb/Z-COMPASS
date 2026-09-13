import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/support", label: "Support" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" aria-label="Z-COMPASS home" className="shrink-0">
          <Logo variant="full" size="sm" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button variant="brand" size="default" asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>

        <button
          type="button"
          className="relative z-50 inline-flex size-11 touch-manipulation select-none items-center justify-center rounded-lg border border-border text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onPointerUp={() => setOpen((v) => !v)}
          onClick={(e) => {
            if (e.detail === 0) setOpen((v) => !v);
          }}
        >
          {open ? (
            <X className="pointer-events-none size-5" />
          ) : (
            <Menu className="pointer-events-none size-5" />
          )}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/60 md:hidden",
          open ? "max-h-72" : "max-h-0",
        )}
        style={{ transition: "max-height 240ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex flex-col gap-2 px-5 py-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between">
            <ThemeToggle />
            <Button variant="brand" asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

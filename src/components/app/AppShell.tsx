import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookMarked,
  Compass as CompassIcon,
  HelpCircle,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PenLine,
  Settings,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { SearchTrigger } from "@/components/app/SearchCommand";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const primaryNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clarity", label: "Clarity", icon: PenLine },
  { to: "/compass", label: "Compass", icon: CompassIcon },
  { to: "/remember", label: "Remember", icon: BookMarked },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/reflections", label: "Reflections", icon: Sparkles },
  { to: "/history", label: "History", icon: History },
] as const;

const secondaryNav = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/how-it-works", label: "How it works", icon: HelpCircle },
  { to: "/support", label: "Support", icon: LifeBuoy },
] as const;

export function AppShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <RequireAuth>
      <div className="relative isolate min-h-screen overflow-hidden bg-background lg:grid lg:grid-cols-[16rem_1fr]">
        <div className="compass-ambient" aria-hidden="true">
          <div className="compass-ambient__glow" />
          <div className="compass-ambient__dial">
            <span className="compass-ambient__ring compass-ambient__ring--outer" />
            <span className="compass-ambient__ring compass-ambient__ring--middle" />
            <span className="compass-ambient__ring compass-ambient__ring--inner" />
            <span className="compass-ambient__axis compass-ambient__axis--vertical" />
            <span className="compass-ambient__axis compass-ambient__axis--horizontal" />
            <span className="compass-ambient__needle" />
            <span className="compass-ambient__core" />
          </div>
        </div>
        <MobileBar open={mobileOpen} onToggle={() => setMobileOpen((o) => !o)} />
        <Sidebar className="relative z-20 hidden lg:flex" />
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              className="absolute inset-0 bg-background/80 backdrop-blur"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <Sidebar
              className="no-scrollbar relative z-50 h-dvh w-72 overflow-y-auto overscroll-contain"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        )}

        <main className="relative z-10 min-w-0 px-5 pb-20 pt-6 lg:px-10 lg:pt-10">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-words font-display text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
              {description && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {action}
          </header>
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}

function MobileBar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
      <Link to="/dashboard">
        <Logo variant="full" size="sm" />
      </Link>
      <div className="flex items-center gap-2">
        <SearchTrigger className="w-auto" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggle}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="size-10 shrink-0"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>
    </div>
  );
}

function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { profile, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "flex flex-col gap-6 border-r border-border bg-surface/60 px-4 py-6 backdrop-blur lg:sticky lg:top-0 lg:h-screen",
        className,
      )}
    >
      <Link to="/dashboard" onClick={onNavigate} className="px-2">
        <Logo variant="full" size="sm" />
      </Link>

      <SearchTrigger />

      <nav className="flex flex-1 flex-col gap-1">
        {primaryNav.map((item) => (
          <NavItem key={item.to} {...item} active={pathname === item.to} onClick={onNavigate} />
        ))}
        <div className="my-3 h-px bg-border" />
        {secondaryNav.map((item) => (
          <NavItem key={item.to} {...item} active={pathname === item.to} onClick={onNavigate} />
        ))}
      </nav>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-sm text-muted-foreground">Appearance</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="truncate text-sm text-muted-foreground">
            {profile?.display_name ?? "Your space"}
          </span>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  to: (typeof primaryNav)[number]["to"] | (typeof secondaryNav)[number]["to"];
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onClick?: (() => void) | undefined;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-gradient-brand text-primary-foreground shadow-glow"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

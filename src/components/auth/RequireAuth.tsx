import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { CompassDial } from "@/components/brand/CompassDial";
import { useAuth } from "@/lib/auth";

/**
 * Client-side route guard. The app is a client-rendered SPA, so the session
 * lives in the browser; we wait for it to resolve before deciding.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    if (profile && !profile.onboarding_completed) {
      void navigate({ to: "/welcome", replace: true });
    }
  }, [loading, user, profile, navigate]);

  if (loading || !user) return <AuthSplash />;
  return <>{children}</>;
}

export function AuthSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-40 opacity-70">
        <CompassDial className="w-full" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

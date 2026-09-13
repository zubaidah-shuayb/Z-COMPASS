import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthSplash } from "@/components/auth/RequireAuth";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { INTEREST_AREAS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — Z-COMPASS" },
      { name: "description", content: "Set up your Z-COMPASS in a few seconds." },
      { property: "og:title", content: "Welcome — Z-COMPASS" },
      { property: "og:description", content: "Set up your Z-COMPASS in a few seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile?.display_name && !name) setName(profile.display_name);
  }, [profile, name]);

  if (loading || !user) return <AuthSplash />;

  const finish = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: name.trim() || null,
      interests,
      onboarding_completed: true,
    });
    setBusy(false);
    if (error) {
      toast.error("We couldn't save that. Please try again.");
      return;
    }
    await refreshProfile();
    void navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-halo px-5 py-14">
      <div className="w-full max-w-lg">
        <Logo variant="full" size="md" className="mx-auto w-fit" />

        <div className="surface-panel mt-8 p-8">
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-gradient-brand" : "bg-border",
                )}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="mt-8 space-y-4">
              <h1 className="font-display text-2xl font-semibold">
                Welcome to <span className="text-gradient-brand">Z-COMPASS</span>
              </h1>
              <p className="text-muted-foreground">
                This is your private space to think clearly, decide with intent, and keep what
                matters. Nothing here is shared with anyone.
              </p>
              <p className="text-sm text-muted-foreground">
                The compass provides direction. You choose the path.
              </p>
              <Button variant="brand" size="lg" onClick={() => setStep(1)}>
                Get started <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="mt-8 space-y-4">
              <h1 className="font-display text-2xl font-semibold">What should we call you?</h1>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="subtle" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button variant="brand" onClick={() => setStep(2)} disabled={!name.trim()}>
                  Continue <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold">What's on your mind lately?</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pick any that fit — this just helps organise your space. You can change it later.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTEREST_AREAS.map((area) => {
                  const active = interests.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setInterests((prev) =>
                          prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors",
                        active
                          ? "border-transparent bg-gradient-brand text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
                      )}
                    >
                      {active && <Check className="size-3.5" />}
                      {area}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="subtle" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="brand" onClick={finish} disabled={busy}>
                  {busy ? "Setting up…" : "Enter Z-COMPASS"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                No pressure to start a Compass session — look around first if you like.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { INTEREST_AREAS, SUPPORT_EMAIL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Z-COMPASS" },
      { name: "description", content: "Your name, areas of interest and appearance." },
      { property: "og:title", content: "Settings — Z-COMPASS" },
      { property: "og:description", content: "Your name, areas of interest and appearance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(profile?.display_name ?? "");
    setInterests(profile?.interests ?? []);
  }, [profile]);

  return (
    <AppShell title="Settings" description="Your space, the way you want it.">
      <div className="grid max-w-3xl gap-6">
        <section className="surface-panel p-6">
          <h2 className="font-display text-lg font-semibold">Profile</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!user) return;
              setBusy(true);
              const { error } = await supabase
                .from("profiles")
                .update({ display_name: name.trim() || null, interests })
                .eq("id", user.id);
              setBusy(false);
              if (error) {
                toast.error("We couldn't save your changes.");
                return;
              }
              await refreshProfile();
              toast.success("Saved.");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="settings-name">Display name</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Areas of interest</Label>
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
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        active
                          ? "border-transparent bg-gradient-brand text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
                      )}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button type="submit" variant="brand" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </section>

        <section className="surface-panel p-6">
          <h2 className="font-display text-lg font-semibold">Appearance</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Z-COMPASS follows your system by default. Dark is its natural home.
          </p>
          <div className="mt-4 w-fit">
            <ThemeToggle />
          </div>
        </section>

        <section className="surface-panel p-6">
          <h2 className="font-display text-lg font-semibold">Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {user?.email}. Everything you write stays private to this account.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="subtle" onClick={() => void signOut()}>
              Sign out
            </Button>
            <Button variant="ghost" asChild>
              <a href={`mailto:${SUPPORT_EMAIL}`}>Contact support</a>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

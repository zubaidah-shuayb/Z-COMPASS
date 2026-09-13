import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookMarked, PenLine } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your compass — Z-COMPASS" },
      { name: "description", content: "Your clarity entries, saved notes and next steps." },
      { property: "og:title", content: "Your compass — Z-COMPASS" },
      { property: "og:description", content: "Your clarity entries, saved notes and next steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, user } = useAuth();
  const name = profile?.display_name?.split(" ")[0];

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const [clarity, memories] = await Promise.all([
        supabase
          .from("clarity_entries")
          .select("id, title, content, updated_at")
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("memories")
          .select("id, title, content, updated_at")
          .order("updated_at", { ascending: false })
          .limit(3),
      ]);
      return {
        clarity: clarity.data ?? [],
        memories: memories.data ?? [],
      };
    },
  });

  return (
    <AppShell
      title={name ? `Hello, ${name}` : "Your compass"}
      description="Start with what's on your mind. Everything you keep here stays private to you."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="surface-panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <PenLine className="size-4" /> Clarity
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clarity">
                Open <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : data?.clarity.length ? (
              data.clarity.map((entry) => (
                <Link
                  key={entry.id}
                  to="/clarity"
                  className="block rounded-lg border border-border p-3 transition-colors hover:border-border-strong"
                >
                  <p className="truncate text-sm font-medium">
                    {entry.title || entry.content.slice(0, 50) || "Untitled thought"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{entry.content}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing captured yet. Write down the thought that keeps coming back.
              </p>
            )}
          </div>
        </section>

        <section className="surface-panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <BookMarked className="size-4" /> Remember
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/remember">
                Open <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : data?.memories.length ? (
              data.memories.map((memory) => (
                <Link
                  key={memory.id}
                  to="/remember"
                  className="block rounded-lg border border-border p-3 transition-colors hover:border-border-strong"
                >
                  <p className="truncate text-sm font-medium">
                    {memory.title || memory.content.slice(0, 50)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{memory.content}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Save the details your future self will thank you for.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

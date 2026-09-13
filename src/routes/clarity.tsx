import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/clarity")({
  head: () => ({
    meta: [
      { title: "Clarity — Z-COMPASS" },
      { name: "description", content: "Capture what's on your mind, exactly as it sits there." },
      { property: "og:title", content: "Clarity — Z-COMPASS" },
      { property: "og:description", content: "Capture what's on your mind, exactly as it sits there." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClarityPage,
});

type ClarityEntry = {
  id: string;
  title: string | null;
  content: string;
  updated_at: string;
};

function ClarityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["clarity", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clarity_entries")
        .select("id, title, content, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClarityEntry[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("clarity_entries").insert({
        user_id: user.id,
        title: title.trim() || null,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setTitle("");
      setContent("");
      toast.success("Captured.");
      await queryClient.invalidateQueries({ queryKey: ["clarity"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("We couldn't save that. Please try again."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clarity_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clarity"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("We couldn't delete that."),
  });

  return (
    <AppShell
      title="Clarity"
      description="Get it out of your head first. No structure needed — write it the way you'd say it."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="surface-panel h-fit p-6">
          <h2 className="font-display text-lg font-semibold">What's on your mind?</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!content.trim()) return;
              create.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="clarity-title">Title (optional)</Label>
              <Input
                id="clarity-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A few words to find it later"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clarity-content">The thought</Label>
              <Textarea
                id="clarity-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Write it exactly as it sits in your head…"
              />
            </div>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              disabled={!content.trim() || create.isPending}
            >
              <Plus className="size-4" />
              {create.isPending ? "Saving…" : "Capture"}
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          {isLoading && <Skeleton className="h-28 w-full" />}
          {error && (
            <div className="surface-panel p-6 text-sm text-muted-foreground">
              We couldn't load your entries. Check your connection and refresh.
            </div>
          )}
          {!isLoading && !error && data?.length === 0 && (
            <div className="surface-panel p-8 text-center">
              <h2 className="font-display text-lg font-semibold">Nothing here yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Every direction begins with a question. Write the one that's been sitting with you.
              </p>
            </div>
          )}
          {data?.map((entry) => (
            <article key={entry.id} className="surface-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">
                    {entry.title || entry.content.slice(0, 60) || "Untitled thought"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(entry.updated_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Delete entry"
                  onClick={() => remove.mutate(entry.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {entry.content}
              </p>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

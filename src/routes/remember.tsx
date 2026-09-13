import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/remember")({
  head: () => ({
    meta: [
      { title: "Remember — Z-COMPASS" },
      { name: "description", content: "Keep the details your future self will want, and find them fast." },
      { property: "og:title", content: "Remember — Z-COMPASS" },
      {
        property: "og:description",
        content: "Keep the details your future self will want, and find them fast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RememberPage,
});

type Memory = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

function RememberPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["memories", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("id, title, content, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Memory[];
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (m) => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q),
    );
  }, [data, query]);

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("memories")
        .insert({ user_id: user.id, title: title.trim(), content: content.trim() });
      if (error) throw error;
    },
    onSuccess: async () => {
      setTitle("");
      setContent("");
      toast.success("Saved.");
      await queryClient.invalidateQueries({ queryKey: ["memories"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("We couldn't save that. Please try again."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("memories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["memories"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("We couldn't delete that."),
  });

  return (
    <AppShell
      title="Remember"
      description="Where the spare key is. Why that choice was made. Save it once, find it whenever."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="surface-panel h-fit p-6">
          <h2 className="font-display text-lg font-semibold">Save something</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!content.trim()) return;
              create.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="memory-title">Title</Label>
              <Input
                id="memory-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Spare key location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory-content">Details</Label>
              <Textarea
                id="memory-content"
                rows={7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="The detail you'll want later…"
              />
            </div>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              disabled={!content.trim() || create.isPending}
            >
              <Plus className="size-4" />
              {create.isPending ? "Saving…" : "Save"}
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search what you've saved"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search saved notes"
            />
          </div>

          {isLoading && <Skeleton className="h-28 w-full" />}
          {error && (
            <div className="surface-panel p-6 text-sm text-muted-foreground">
              We couldn't load your notes. Check your connection and refresh.
            </div>
          )}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="surface-panel p-8 text-center">
              <h2 className="font-display text-lg font-semibold">
                {query ? "Nothing matched" : "Nothing saved yet"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {query
                  ? "Try a different word."
                  : "Give your future self the context you have right now."}
              </p>
            </div>
          )}
          {filtered.map((memory) => (
            <article key={memory.id} className="surface-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 truncate font-medium">
                  {memory.title || memory.content.slice(0, 60)}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Delete note"
                  onClick={() => remove.mutate(memory.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {memory.content}
              </p>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

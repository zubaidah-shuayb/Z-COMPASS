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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Z-COMPASS" },
      { name: "description", content: "Turn decisions into steps you can actually move on." },
      { property: "og:title", content: "Progress — Z-COMPASS" },
      {
        property: "og:description",
        content: "Turn decisions into steps you can actually move on.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgressPage,
});

type Status = "not_started" | "in_progress" | "done" | "abandoned";

type Item = {
  id: string;
  title: string;
  detail: string | null;
  status: Status;
  due_date: string | null;
  updated_at: string;
};

type Update = {
  id: string;
  progress_item_id: string;
  note: string;
  created_at: string;
};

const statuses: { value: Status; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "abandoned", label: "Let go" },
];

function ProgressPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [dueDate, setDueDate] = useState("");

  const items = useQuery({
    queryKey: ["progress-items", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_items")
        .select("id, title, detail, status, due_date, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const updates = useQuery({
    queryKey: ["progress-updates", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_updates")
        .select("id, progress_item_id, note, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Update[];
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["progress-items"] });
    await queryClient.invalidateQueries({ queryKey: ["progress-updates"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("progress_items").insert({
        user_id: user.id,
        title: title.trim(),
        detail: detail.trim() || null,
        due_date: dueDate || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setTitle("");
      setDetail("");
      setDueDate("");
      toast.success("Step added.");
      await invalidate();
    },
    onError: () => toast.error("We couldn't add that step."),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("progress_items").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("We couldn't update that step."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("progress_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("We couldn't remove that step."),
  });

  const addUpdate = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("progress_updates")
        .insert({ progress_item_id: id, user_id: user.id, note });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Update logged.");
      await invalidate();
    },
    onError: () => toast.error("We couldn't log that update."),
  });

  return (
    <AppShell
      title="Progress"
      description="Direction only counts when it moves. Track the steps that follow your decisions."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="surface-panel h-fit min-w-0 p-4 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Add a step</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              create.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="progress-title">Step</Label>
              <Input
                id="progress-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Call the landlord"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress-detail">Detail</Label>
              <Textarea
                id="progress-detail"
                rows={4}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="What needs to happen, and why it matters."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress-due">Target date</Label>
              <Input
                id="progress-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              disabled={!title.trim() || create.isPending}
            >
              <Plus className="size-4" />
              {create.isPending ? "Adding…" : "Add step"}
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          {items.isLoading && <Skeleton className="h-28 w-full" />}
          {items.error && (
            <div className="surface-panel p-6 text-sm text-muted-foreground">
              We couldn't load your steps. Check your connection and refresh.
            </div>
          )}
          {!items.isLoading && !items.error && (items.data ?? []).length === 0 && (
            <div className="surface-panel p-8 text-center">
              <h2 className="font-display text-lg font-semibold">Nothing in motion yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Add the first small step. Momentum beats planning.
              </p>
            </div>
          )}
          {(items.data ?? []).map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              updates={(updates.data ?? []).filter((u) => u.progress_item_id === item.id)}
              onStatus={(status) => setStatus.mutate({ id: item.id, status })}
              onRemove={() => remove.mutate(item.id)}
              onUpdate={(note) => addUpdate.mutate({ id: item.id, note })}
            />
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function ItemCard({
  item,
  updates,
  onStatus,
  onRemove,
  onUpdate,
}: {
  item: Item;
  updates: Update[];
  onStatus: (status: Status) => void;
  onRemove: () => void;
  onUpdate: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <article className="surface-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={cn("truncate font-medium", item.status === "done" && "line-through")}>
            {item.title}
          </h3>
          {item.due_date && (
            <p className="mt-1 text-xs text-muted-foreground">Target {item.due_date}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" aria-label="Delete step" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      {item.detail && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.detail}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onStatus(s.value)}
            aria-pressed={item.status === s.value}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              item.status === s.value
                ? "border-transparent bg-gradient-brand text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = note.trim();
          if (!trimmed) return;
          onUpdate(trimmed);
          setNote("");
        }}
      >
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Log an update…"
          aria-label={`Log an update for ${item.title}`}
        />
        <Button type="submit" variant="outline" disabled={!note.trim()}>
          Log
        </Button>
      </form>

      {updates.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
          {updates.map((u) => (
            <li key={u.id}>
              <span className="text-xs opacity-70">
                {new Date(u.created_at).toLocaleDateString()}
              </span>{" "}
              {u.note}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

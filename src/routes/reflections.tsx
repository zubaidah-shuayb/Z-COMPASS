import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reflections")({
  head: () => ({
    meta: [
      { title: "Reflections — Z-COMPASS" },
      { name: "description", content: "Look back on what happened, and keep what you learned." },
      { property: "og:title", content: "Reflections — Z-COMPASS" },
      {
        property: "og:description",
        content: "Look back on what happened, and keep what you learned.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReflectionsPage,
});

type Reflection = {
  id: string;
  decision_id: string | null;
  outcome: string;
  learned: string;
  satisfaction: number | null;
  created_at: string;
};

type DecisionOption = { id: string; title: string };

const NONE = "none";

function ReflectionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState("");
  const [learned, setLearned] = useState("");
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [decisionId, setDecisionId] = useState<string>(NONE);

  const reflections = useQuery({
    queryKey: ["reflections", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reflections")
        .select("id, decision_id, outcome, learned, satisfaction, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Reflection[];
    },
  });

  const decisions = useQuery({
    queryKey: ["reflection-decisions", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decisions")
        .select("id, title")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DecisionOption[];
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["reflections"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("reflections").insert({
        user_id: user.id,
        decision_id: decisionId === NONE ? null : decisionId,
        outcome: outcome.trim(),
        learned: learned.trim(),
        satisfaction,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setOutcome("");
      setLearned("");
      setSatisfaction(null);
      setDecisionId(NONE);
      toast.success("Reflection saved.");
      await invalidate();
    },
    onError: () => toast.error("We couldn't save that reflection."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reflections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("We couldn't delete that reflection."),
  });

  const decisionTitle = (id: string | null) =>
    id ? ((decisions.data ?? []).find((d) => d.id === id)?.title ?? null) : null;

  return (
    <AppShell
      title="Reflections"
      description="What actually happened, and what you'd tell yourself next time."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="surface-panel h-fit p-6">
          <h2 className="font-display text-lg font-semibold">Look back</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!outcome.trim()) return;
              create.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="reflection-outcome">What happened</Label>
              <Textarea
                id="reflection-outcome"
                rows={4}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="The outcome, plainly."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reflection-learned">What you learned</Label>
              <Textarea
                id="reflection-learned"
                rows={4}
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                placeholder="The part worth carrying forward."
              />
            </div>
            <div className="space-y-2">
              <Label>Linked decision (optional)</Label>
              <Select value={decisionId} onValueChange={setDecisionId}>
                <SelectTrigger>
                  <SelectValue placeholder="No decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No decision</SelectItem>
                  {(decisions.data ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>How you feel about it</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSatisfaction(satisfaction === n ? null : n)}
                    aria-pressed={satisfaction === n}
                    aria-label={`${n} out of 5`}
                    className={cn(
                      "size-9 rounded-lg border text-sm transition-colors",
                      satisfaction === n
                        ? "border-transparent bg-gradient-brand text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              disabled={!outcome.trim() || create.isPending}
            >
              <Plus className="size-4" />
              {create.isPending ? "Saving…" : "Save reflection"}
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          {reflections.isLoading && <Skeleton className="h-28 w-full" />}
          {reflections.error && (
            <div className="surface-panel p-6 text-sm text-muted-foreground">
              We couldn't load your reflections. Check your connection and refresh.
            </div>
          )}
          {!reflections.isLoading && !reflections.error && (reflections.data ?? []).length === 0 && (
            <div className="surface-panel p-8 text-center">
              <h2 className="font-display text-lg font-semibold">No reflections yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                After a decision plays out, come back and write what you saw.
              </p>
            </div>
          )}
          {(reflections.data ?? []).map((r) => (
            <article key={r.id} className="surface-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                    {decisionTitle(r.decision_id) ? ` · ${decisionTitle(r.decision_id)}` : ""}
                    {r.satisfaction ? ` · ${r.satisfaction}/5` : ""}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{r.outcome}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Delete reflection"
                  onClick={() => remove.mutate(r.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {r.learned && (
                <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted-foreground">
                  {r.learned}
                </p>
              )}
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

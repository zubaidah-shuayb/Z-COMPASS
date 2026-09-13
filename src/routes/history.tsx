import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Z-COMPASS" },
      { name: "description", content: "Every decision you saved, with the direction you chose." },
      { property: "og:title", content: "History — Z-COMPASS" },
      {
        property: "og:description",
        content: "Every decision you saved, with the direction you chose.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

type SavedDecision = {
  id: string;
  title: string;
  context: string;
  saved_at: string | null;
  updated_at: string;
};

type Result = {
  decision_id: string;
  headline: string;
  summary: string;
  created_at: string;
};

function HistoryPage() {
  const { user } = useAuth();

  const decisions = useQuery({
    queryKey: ["history-decisions", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decisions")
        .select("id, title, context, saved_at, updated_at")
        .eq("status", "saved")
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedDecision[];
    },
  });

  const results = useQuery({
    queryKey: ["history-results", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compass_results")
        .select("decision_id, headline, summary, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Result[];
    },
  });

  const latestResult = (decisionId: string) =>
    (results.data ?? []).find((r) => r.decision_id === decisionId) ?? null;

  return (
    <AppShell
      title="History"
      description="The decisions you chose to keep, and the direction that came out of each one."
    >
      <div className="space-y-3">
        {decisions.isLoading && <Skeleton className="h-28 w-full" />}
        {decisions.error && (
          <div className="surface-panel p-6 text-sm text-muted-foreground">
            We couldn't load your history. Check your connection and refresh.
          </div>
        )}
        {!decisions.isLoading && !decisions.error && (decisions.data ?? []).length === 0 && (
          <div className="surface-panel p-8 text-center">
            <h2 className="font-display text-lg font-semibold">Nothing saved yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Finish a Compass session and save it — it will appear here.
            </p>
            <Link
              to="/compass"
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Open the Compass <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
        {(decisions.data ?? []).map((decision) => {
          const result = latestResult(decision.id);
          return (
            <Link
              key={decision.id}
              to="/compass/$decisionId"
              params={{ decisionId: decision.id }}
              className="surface-panel block p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 break-words font-display text-lg font-semibold">
                  {decision.title}
                </h2>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(decision.saved_at ?? decision.updated_at).toLocaleDateString()}
                </span>
              </div>
              {result?.headline && <p className="mt-2 text-sm text-primary">{result.headline}</p>}
              <p className="mt-2 break-words text-sm text-muted-foreground">
                {result?.summary || decision.context || "No context saved."}
              </p>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}

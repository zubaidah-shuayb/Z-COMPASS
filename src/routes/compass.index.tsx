import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Compass as CompassIcon, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { CompassDraftV2 } from "@/lib/compass";

export const Route = createFileRoute("/compass/")({
  head: () => ({ meta: [
    { title: "Compass — Z-COMPASS" },
    { name: "description", content: "Bring your confusion and discover the decision inside it." },
    { property: "og:title", content: "Compass — Z-COMPASS" },
    { property: "og:description", content: "Bring your confusion and discover the decision inside it." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: CompassPage,
});

type DecisionRow = { id: string; title: string; context: string; status: string; updated_at: string; decision_sessions: { experience_version: number }[] | null };
const statusLabel: Record<string, string> = { draft: "Draft", in_progress: "In progress", saved: "Saved", archived: "Archived" };

function CompassPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [situation, setSituation] = useState("");
  const sessions = useQuery({ queryKey: ["decisions", user?.id, "compass-v2"], enabled: Boolean(user), queryFn: async () => {
    const { data, error } = await supabase.from("decisions").select("id, title, context, status, updated_at, decision_sessions(experience_version)").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DecisionRow[];
  } });
  const create = useMutation({ mutationFn: async () => {
    if (!user) throw new Error("Not signed in");
    const clean = situation.trim();
    const provisionalTitle = clean.split(/[.!?\n]/)[0]?.slice(0, 100) || "Untitled situation";
    const { data, error } = await supabase.from("decisions").insert({ user_id: user.id, title: provisionalTitle, context: clean, status: "in_progress" }).select("id").single();
    if (error) throw error;
    const draft: CompassDraftV2 = { version: 2, situation: clean, current_stage: "situation", completed_stages: [], answers: [], reactions: {} };
    const { error: sessionError } = await supabase.from("decision_sessions").insert({ decision_id: data.id, user_id: user.id, stage: "situation", draft, experience_version: 2 });
    if (sessionError) throw sessionError;
    return data.id as string;
  }, onSuccess: async (id) => { setSituation(""); await qc.invalidateQueries({ queryKey: ["decisions"] }); void navigate({ to: "/compass/$decisionId", params: { decisionId: id } }); }, onError: () => toast.error("We couldn't open a new Compass session.") });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("decisions").delete().eq("id", id); if (error) throw error; }, onSuccess: () => qc.invalidateQueries({ queryKey: ["decisions"] }), onError: () => toast.error("We couldn't delete that session.") });
  const confirmRemove = (id: string, title: string) => { if (window.confirm(`Delete “${title}”? This removes the session and everything in it.`)) remove.mutate(id); };

  return <AppShell title="Compass" description="You bring the mess. Z-COMPASS finds the decision inside it."><div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]"><section className="compass-entry surface-panel relative overflow-hidden p-6 sm:p-8"><div className="relative z-10"><div className="mb-6 grid size-12 place-items-center rounded-full border border-primary/40 text-primary shadow-glow"><CompassIcon className="size-6" /></div><h2 className="max-w-lg font-display text-2xl font-semibold leading-tight sm:text-3xl">What’s pulling you in different directions?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Tell me what’s happening. It doesn’t need to be organised.</p><Textarea className="mt-6 min-h-56 resize-y bg-background/55 text-base leading-7" value={situation} onChange={(event) => setSituation(event.target.value)} maxLength={6000} placeholder="I have too many things competing for my attention…" /><div className="mt-5 flex justify-center"><Button variant="brand" size="lg" onClick={() => create.mutate()} disabled={situation.trim().length < 20 || create.isPending}><Sparkles className="size-4" />{create.isPending ? "Opening your Compass…" : "Find my direction"}</Button></div></div></section><section><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Your sessions</h2><span className="text-xs text-muted-foreground">Leave and return anytime</span></div><div className="space-y-3">{sessions.isLoading && <Skeleton className="h-28 w-full" />}{sessions.error && <div className="surface-panel p-5 text-sm text-muted-foreground">The new Compass needs its database update before sessions can load.</div>}{!sessions.isLoading && !sessions.error && sessions.data?.length === 0 && <div className="surface-panel p-8 text-center text-sm text-muted-foreground">Your first direction starts with whatever is on your mind.</div>}{sessions.data?.map((decision) => { const version = decision.decision_sessions?.[0]?.experience_version ?? 1; return <article key={decision.id} className="surface-panel p-5"><div className="flex items-start justify-between gap-3"><button type="button" className="min-w-0 flex-1 text-left" onClick={() => void navigate({ to: "/compass/$decisionId", params: { decisionId: decision.id } })}><div className="flex items-center gap-2"><h3 className="break-words font-medium">{decision.title}</h3>{version === 1 && <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[0.65rem] text-muted-foreground">Legacy</span>}</div><p className="mt-1 text-xs text-muted-foreground">{statusLabel[decision.status] ?? decision.status} · {new Date(decision.updated_at).toLocaleDateString()}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{decision.context}</p><span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">{decision.status === "saved" ? "View direction" : "Continue journey"}<ArrowRight className="size-3" /></span></button><Button variant="ghost" size="sm" aria-label="Delete session" onClick={() => confirmRemove(decision.id, decision.title)}><Trash2 className="size-4" /></Button></div></article>; })}</div></section></div></AppShell>;
}

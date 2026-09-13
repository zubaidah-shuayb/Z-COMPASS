import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Compass, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import {
  DiscoveryStageView,
  FutureStage,
  JourneyRail,
  MapStage,
  NorthStage,
  PathsStage,
  PressureStage,
  previousStage,
  StageRecovery,
  QuestionsStage,
  SituationStage,
} from "@/components/compass/CompassJourney";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  callCompass,
  CompassError,
  type CompassDraftV2,
  type CompassMap,
  type Discovery,
  type DiscoveryStage,
  type FutureGlance,
  type FutureReaction,
  type NorthResult,
  type PathsResult,
  type PressureTest,
  type QuestionAnswer,
  type QuestionSet,
} from "@/lib/compass";

export const Route = createFileRoute("/compass/$decisionId")({
  head: () => ({
    meta: [
      { title: "Compass journey — Z-COMPASS" },
      { name: "description", content: "Discover the decision inside a complicated situation." },
      { property: "og:title", content: "Compass journey — Z-COMPASS" },
      { property: "og:description", content: "Discover the decision inside a complicated situation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompassSessionPage,
});

type Decision = { id: string; title: string; context: string; status: string };
type Session = { id: string; stage: string; draft: unknown; experience_version: number };
type LegacyResult = { headline: string; summary: string; reasoning: string; tradeoffs: string[]; next_steps: string[] };

const emptyDraft = (situation = ""): CompassDraftV2 => ({
  version: 2,
  situation,
  current_stage: "situation",
  completed_stages: [],
  answers: [],
  reactions: {},
});

function isDraftV2(value: unknown): value is CompassDraftV2 {
  return Boolean(value && typeof value === "object" && (value as { version?: unknown }).version === 2);
}

function CompassSessionPage() {
  const { decisionId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<CompassDraftV2>(emptyDraft());
  const [stage, setStage] = useState<DiscoveryStage>("situation");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [progressCreated, setProgressCreated] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  const sessionQuery = useQuery({
    queryKey: ["compass-session-v2", decisionId],
    enabled: Boolean(user),
    queryFn: async () => {
      const [decisionResponse, sessionResponse, resultResponse] = await Promise.all([
        supabase.from("decisions").select("id, title, context, status").eq("id", decisionId).maybeSingle(),
        supabase.from("decision_sessions").select("id, stage, draft, experience_version").eq("decision_id", decisionId).maybeSingle(),
        supabase.from("compass_results").select("headline, summary, reasoning, tradeoffs, next_steps").eq("decision_id", decisionId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (decisionResponse.error) throw decisionResponse.error;
      if (sessionResponse.error) throw sessionResponse.error;
      if (resultResponse.error) throw resultResponse.error;
      return {
        decision: decisionResponse.data as Decision | null,
        session: sessionResponse.data as Session | null,
        legacyResult: resultResponse.data as LegacyResult | null,
      };
    },
  });

  const decision = sessionQuery.data?.decision;
  const session = sessionQuery.data?.session;
  const legacy = Boolean(session && session.experience_version !== 2);

  useEffect(() => {
    if (hydrated.current || !decision || !session) return;
    hydrated.current = true;
    if (session.experience_version === 2 && isDraftV2(session.draft)) {
      setDraft(session.draft);
      setStage(session.draft.current_stage ?? (session.stage as DiscoveryStage));
    } else {
      setDraft(emptyDraft(decision.context));
    }
  }, [decision, session]);

  const writeDraft = useCallback(async (next: CompassDraftV2, nextStage: DiscoveryStage) => {
    if (!user) return;
    setSaveState("saving");
    const { error } = await supabase.from("decision_sessions").upsert({
      decision_id: decisionId,
      user_id: user.id,
      stage: nextStage,
      draft: { ...next, current_stage: nextStage },
      experience_version: 2,
    }, { onConflict: "decision_id" });
    if (error) {
      setSaveState("idle");
      throw error;
    }
    setSaveState("saved");
  }, [decisionId, user]);

  useEffect(() => {
    if (!hydrated.current || legacy || !session) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      void writeDraft(draft, stage).catch(() => toast.error("We couldn't save your Compass session."));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draft, legacy, session, stage, writeDraft]);

  const advance = useCallback(async (nextStage: DiscoveryStage, patch: Partial<CompassDraftV2>) => {
    const completed = Array.from(new Set([...(draft.completed_stages ?? []), stage]));
    const next = { ...draft, ...patch, current_stage: nextStage, completed_stages: completed };
    setDraft(next);
    setStage(nextStage);
    await writeDraft(next, nextStage);
  }, [draft, stage, writeDraft]);

  const aiError = (error: unknown) => toast.error(error instanceof CompassError ? error.message : "The Compass couldn't respond.");

  const mapSituation = useMutation({
    mutationFn: async () => {
      if (draft.map && !window.confirm("Rebuild the Compass Map? Later discoveries in this session will be replaced.")) return;
      await writeDraft(draft, "situation");
      const result = await callCompass<CompassMap>("map_situation", decisionId, { situation: draft.situation });
      await supabase.from("decisions").update({ title: result.title, context: draft.situation }).eq("id", decisionId);
      await advance("map", { map: result, questions: undefined, discovery: undefined, paths: undefined, pressure_test: undefined, future_glance: undefined, north: undefined });
    },
    onError: aiError,
  });

  const questions = useMutation({
    mutationFn: async () => {
      if (draft.questions && !window.confirm("Generate new questions? Your current answers and later discoveries will be replaced.")) return;
      const result = await callCompass<QuestionSet>("generate_questions", decisionId, { situation: draft.situation, map: draft.map });
      await advance("questions", { questions: result.questions, answers: [] });
    }, onError: aiError,
  });

  const discover = useMutation({
    mutationFn: async () => {
      if (draft.discovery && !window.confirm("Revisit this discovery? Later paths and direction will be replaced.")) return;
      await writeDraft(draft, "questions");
      const result = await callCompass<Discovery>("discover_conflict", decisionId, { situation: draft.situation, map: draft.map, questions: draft.questions, answers: draft.answers });
      await advance("discovery", { discovery: result, paths: undefined, pressure_test: undefined, future_glance: undefined, north: undefined });
    }, onError: aiError,
  });

  const paths = useMutation({
    mutationFn: async () => {
      if (draft.paths && !window.confirm("Generate new paths? The current pressure test and future glance will be replaced.")) return;
      const result = await callCompass<PathsResult>("generate_paths", decisionId, { situation: draft.situation, map: draft.map, questions: draft.questions, answers: draft.answers, discovery: draft.discovery });
      await advance("paths", { paths: result.paths });
    }, onError: aiError,
  });

  const pressure = useMutation({
    mutationFn: async () => {
      if (draft.pressure_test && !window.confirm("Run the pressure test again? The current future glance and North will be replaced.")) return;
      const result = await callCompass<PressureTest>("pressure_test", decisionId, { situation: draft.situation, discovery: draft.discovery, paths: draft.paths });
      await advance("pressure", { pressure_test: result });
    }, onError: aiError,
  });

  const future = useMutation({
    mutationFn: async () => {
      if (draft.future_glance && !window.confirm("Create a new future glance? Your current reactions and North will be replaced.")) return;
      const result = await callCompass<FutureGlance>("future_glance", decisionId, { situation: draft.situation, discovery: draft.discovery, paths: draft.paths, pressure_test: draft.pressure_test });
      await advance("future", { future_glance: result });
    }, onError: aiError,
  });

  const north = useMutation({
    mutationFn: async () => {
      if (draft.north && !window.confirm("Reconsider your North using the latest session details?")) return;
      await writeDraft(draft, "future");
      const result = await callCompass<NorthResult>("generate_north", decisionId, draft);
      await advance("north", { north: result });
      // Keep one direction per session so History and search never show duplicates.
      await supabase.from("compass_results").delete().eq("decision_id", decisionId);
      const { error } = await supabase.from("compass_results").insert({
        decision_id: decisionId,
        headline: result.direction,
        summary: result.why_it_fits,
        reasoning: result.why_it_fits,
        tradeoffs: [result.trade_off],
        next_steps: [result.next_move],
        alignment: [],
        model: "gemini",
        compass_map: draft.map,
        discovery: draft.discovery,
        paths: draft.paths,
        pressure_test: draft.pressure_test,
        future_glance: draft.future_glance,
        assumptions: result.assumptions,
        change_conditions: result.change_conditions,
        next_move: result.next_move,
        experience_version: 2,
      });
      if (error) throw error;
    }, onError: aiError,
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("decisions").update({ status: "saved", saved_at: new Date().toISOString() }).eq("id", decisionId);
      if (error) throw error;
    },
    onSuccess: async () => { toast.success("Direction saved to History."); await qc.invalidateQueries({ queryKey: ["compass-session-v2", decisionId] }); await qc.invalidateQueries({ queryKey: ["decisions"] }); },
    onError: () => toast.error("We couldn't save this direction."),
  });

  const addProgress = useMutation({
    mutationFn: async () => {
      if (!user || !draft.north?.next_move) throw new Error("No next move");
      const { error } = await supabase.from("progress_items").insert({ user_id: user.id, decision_id: decisionId, title: draft.north.next_move, detail: `From Compass: ${draft.north.direction}`, status: "not_started" });
      if (error) throw error;
    },
    onSuccess: async () => { setProgressCreated(true); toast.success("Next move added to Progress."); await qc.invalidateQueries({ queryKey: ["progress-items"] }); },
    onError: () => toast.error("We couldn't add that next move."),
  });

  const restartLegacy = useMutation({
    mutationFn: async () => {
      if (!user || !decision) throw new Error("Missing session");
      const { data, error } = await supabase.from("decisions").insert({ user_id: user.id, title: decision.title, context: decision.context, status: "in_progress" }).select("id").single();
      if (error) throw error;
      const fresh = emptyDraft(decision.context);
      const { error: sessionError } = await supabase.from("decision_sessions").insert({ decision_id: data.id, user_id: user.id, stage: "situation", draft: fresh, experience_version: 2 });
      if (sessionError) throw sessionError;
      return data.id as string;
    },
    onSuccess: (id) => void navigate({ to: "/compass/$decisionId", params: { decisionId: id } }),
    onError: () => toast.error("We couldn't restart this session."),
  });

  if (sessionQuery.isLoading) return <AppShell title="Compass"><Skeleton className="h-80 w-full" /></AppShell>;
  if (sessionQuery.error) return <AppShell title="Compass unavailable"><div className="surface-panel p-6 text-sm text-muted-foreground">The new Compass needs its database update before this session can open.</div></AppShell>;
  if (!decision || !session) return <AppShell title="Session not found"><Button variant="brand" asChild><Link to="/compass">Back to Compass</Link></Button></AppShell>;

  if (legacy) return <LegacyCompass decision={decision} result={sessionQuery.data?.legacyResult ?? null} restarting={restartLegacy.isPending} onRestart={() => restartLegacy.mutate()} />;

  const answerQuestion = (questionId: string, answer: string, skipped: boolean) => {
    const current = draft.answers ?? [];
    const next: QuestionAnswer[] = [...current.filter((item) => item.question_id !== questionId), { question_id: questionId, answer, skipped }];
    setDraft((value) => ({ ...value, answers: next, discovery: undefined, paths: undefined, pressure_test: undefined, future_glance: undefined, north: undefined, stale_from: "discovery" }));
  };
  const react = (pathId: string, reaction: FutureReaction) => setDraft((value) => ({ ...value, reactions: { ...(value.reactions ?? {}), [pathId]: reaction }, north: undefined, stale_from: "north" }));
  const busy = mapSituation.isPending || questions.isPending || discover.isPending || paths.isPending || pressure.isPending || future.isPending || north.isPending;

  // If a step's content is missing (edited answers, interrupted request, old draft),
  // never show an empty screen — offer a clear way to rebuild that step.
  const stageState: Record<DiscoveryStage, { ready: boolean; retry: () => void; pending: boolean }> = {
    situation: { ready: true, retry: () => mapSituation.mutate(), pending: mapSituation.isPending },
    map: { ready: Boolean(draft.map), retry: () => mapSituation.mutate(), pending: mapSituation.isPending },
    questions: { ready: Boolean(draft.questions?.length), retry: () => questions.mutate(), pending: questions.isPending },
    discovery: { ready: Boolean(draft.discovery), retry: () => discover.mutate(), pending: discover.isPending },
    paths: { ready: Boolean(draft.paths?.length), retry: () => paths.mutate(), pending: paths.isPending },
    pressure: { ready: Boolean(draft.pressure_test?.paths?.length), retry: () => pressure.mutate(), pending: pressure.isPending },
    future: { ready: Boolean(draft.future_glance?.scenarios?.length), retry: () => future.mutate(), pending: future.isPending },
    north: { ready: Boolean(draft.north), retry: () => north.mutate(), pending: north.isPending },
  };
  const current = stageState[stage];

  if (!current.ready) {
    return (
      <AppShell title={draft.map?.title || decision.title || "Compass"} description="You bring the mess. Z-COMPASS helps you find the decision inside it." action={<Button variant="ghost" size="sm" asChild><Link to="/compass"><ArrowLeft className="size-4" />All sessions</Link></Button>}>
        <JourneyRail stage={stage} completed={draft.completed_stages ?? []} onOpen={(next) => { setStage(next); void writeDraft(draft, next); }} />
        <StageRecovery stage={stage} busy={current.pending} onRetry={current.retry} onBack={() => setStage(previousStage(stage))} />
      </AppShell>
    );
  }

  return (
    <AppShell title={draft.map?.title || decision.title || "Compass"} description="You bring the mess. Z-COMPASS helps you find the decision inside it." action={<div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Draft saved" : ""}</span><Button variant="ghost" size="sm" asChild><Link to="/compass"><ArrowLeft className="size-4" />All sessions</Link></Button></div>}>
      <JourneyRail stage={stage} completed={draft.completed_stages ?? []} onOpen={(next) => { setStage(next); void writeDraft(draft, next); }} />
      {stage === "situation" && <SituationStage situation={draft.situation} onChange={(situation) => setDraft((value) => ({ ...value, situation, map: undefined, questions: undefined, discovery: undefined, paths: undefined, pressure_test: undefined, future_glance: undefined, north: undefined, stale_from: "map" }))} onFind={() => mapSituation.mutate()} busy={mapSituation.isPending} />}
      {stage === "map" && <MapStage draft={draft} onNext={() => questions.mutate()} busy={questions.isPending} />}
      {stage === "questions" && <QuestionsStage draft={draft} onAnswer={answerQuestion} onContinue={() => discover.mutate()} busy={discover.isPending} />}
      {stage === "discovery" && <DiscoveryStageView draft={draft} onNext={() => paths.mutate()} busy={paths.isPending} />}
      {stage === "paths" && <PathsStage draft={draft} onNext={() => pressure.mutate()} busy={pressure.isPending} />}
      {stage === "pressure" && <PressureStage draft={draft} onNext={() => future.mutate()} busy={future.isPending} />}
      {stage === "future" && <FutureStage draft={draft} onReact={react} onNext={() => north.mutate()} busy={north.isPending} />}
      {stage === "north" && <NorthStage draft={draft} saved={decision.status === "saved"} progressCreated={progressCreated} onSave={() => save.mutate()} onProgress={() => addProgress.mutate()} onReturn={() => void navigate({ to: "/compass" })} onNew={() => void navigate({ to: "/compass" })} busy={busy || save.isPending} />}
    </AppShell>
  );
}

function LegacyCompass({ decision, result, restarting, onRestart }: { decision: Decision; result: LegacyResult | null; restarting: boolean; onRestart: () => void }) {
  return <AppShell title={decision.title} description="A Compass session from the earlier experience." action={<Button variant="ghost" size="sm" asChild><Link to="/compass"><ArrowLeft className="size-4" />All sessions</Link></Button>}><section className="surface-panel mx-auto max-w-3xl p-6 sm:p-8"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full border border-primary/40 text-primary"><Compass className="size-5" /></span><div><p className="text-xs font-semibold uppercase text-primary">Legacy Compass</p><h2 className="font-display text-xl font-semibold">Your earlier work is preserved</h2></div></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{decision.context || "No situation was recorded."}</p>{result && <div className="mt-6 border-t border-border pt-6"><h3 className="font-display text-lg font-semibold">{result.headline}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{result.reasoning || result.summary}</p></div>}{decision.status !== "saved" && <div className="mt-7"><p className="mb-3 text-sm text-muted-foreground">Continue this situation through the new decision-discovery journey without changing your original session.</p><Button variant="brand" onClick={onRestart} disabled={restarting}><RotateCcw className="size-4" />{restarting ? "Preparing…" : "Start this again in the new Compass"}</Button></div>}</section></AppShell>;
}

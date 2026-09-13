import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Compass,
  Eye,
  Footprints,
  Heart,
  Map,
  Route as RouteIcon,
  Sparkles,
  TestTube2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  answerFor,
  type CompassDraftV2,
  type DiscoveryStage,
  type FutureReaction,
} from "@/lib/compass";
import { cn } from "@/lib/utils";

export const DISCOVERY_STAGES: { key: DiscoveryStage; label: string; icon: typeof Compass }[] = [
  { key: "situation", label: "Your mess", icon: Sparkles },
  { key: "map", label: "Compass Map", icon: Map },
  { key: "questions", label: "Questions", icon: CircleHelp },
  { key: "discovery", label: "Discovery", icon: Eye },
  { key: "paths", label: "Paths", icon: RouteIcon },
  { key: "pressure", label: "Pressure Test", icon: TestTube2 },
  { key: "future", label: "Future Glance", icon: Sparkles },
  { key: "north", label: "Your North", icon: Compass },
];

export function JourneyRail({
  stage,
  completed,
  onOpen,
}: {
  stage: DiscoveryStage;
  completed: DiscoveryStage[];
  onOpen: (stage: DiscoveryStage) => void;
}) {
  const activeIndex = DISCOVERY_STAGES.findIndex((item) => item.key === stage);
  return (
    <nav aria-label="Compass journey" className="mb-8">
      <div className="relative flex items-start justify-between gap-1">
        <div className="absolute left-4 right-4 top-4 h-px bg-border" />
        <div
          className="absolute left-4 top-4 h-px bg-gradient-brand transition-[width] duration-500"
          style={{ width: `${Math.max(0, (activeIndex / (DISCOVERY_STAGES.length - 1)) * 92)}%` }}
        />
        {DISCOVERY_STAGES.map((item, index) => {
          const Icon = item.icon;
          const unlocked = index <= activeIndex || completed.includes(item.key);
          return (
            <button
              key={item.key}
              type="button"
              disabled={!unlocked}
              onClick={() => onOpen(item.key)}
              className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2 text-center disabled:cursor-not-allowed"
              aria-current={stage === item.key ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border bg-background transition-all",
                  stage === item.key && "border-primary text-primary shadow-glow",
                  completed.includes(item.key) && stage !== item.key && "border-lavender text-lavender",
                  !unlocked && "opacity-35",
                )}
              >
                {completed.includes(item.key) && stage !== item.key ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
              </span>
              <span className={cn("hidden text-[0.68rem] text-muted-foreground lg:block", stage === item.key && "text-foreground")}>{item.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground lg:hidden">
        {activeIndex + 1} of {DISCOVERY_STAGES.length} · {DISCOVERY_STAGES[activeIndex]?.label}
      </p>
    </nav>
  );
}

const STAGE_LABEL: Record<DiscoveryStage, string> = {
  situation: "your situation",
  map: "the Compass Map",
  questions: "your questions",
  discovery: "the discovery",
  paths: "your paths",
  pressure: "the pressure test",
  future: "the future glance",
  north: "your North",
};

export function previousStage(stage: DiscoveryStage): DiscoveryStage {
  const index = DISCOVERY_STAGES.findIndex((item) => item.key === stage);
  return DISCOVERY_STAGES[Math.max(0, index - 1)]?.key ?? "situation";
}

export function StageRecovery({ stage, busy, onRetry, onBack }: { stage: DiscoveryStage; busy: boolean; onRetry: () => void; onBack: () => void }) {
  return (
    <StageFrame eyebrow="Let’s pick this back up" title={`We need to rebuild ${STAGE_LABEL[stage]}`} description="Something in this step changed, so there’s nothing here to show yet. You can build it again — everything else in your session stays as it is.">
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="brand" size="lg" onClick={onRetry} disabled={busy}><Sparkles className="size-4" />{busy ? "Working on it…" : "Build this step again"}</Button>
        <Button variant="ghost" size="lg" onClick={onBack} disabled={busy}><ArrowLeft className="size-4" />Go back a step</Button>
      </div>
    </StageFrame>
  );
}

export function SituationStage({ situation, onChange, onFind, busy }: { situation: string; onChange: (value: string) => void; onFind: () => void; busy: boolean }) {
  return (
    <StageFrame eyebrow="Your mess" title="What’s going on?" description="You’ve got a lot on your mind. Start wherever you want — you don’t need to organise it. Just tell me what’s happening.">
      <Textarea value={situation} onChange={(event) => onChange(event.target.value)} rows={11} maxLength={6000} placeholder="Write it as it comes to you…" className="resize-y bg-background/45 text-base leading-7" />
      <div className="mt-5 flex justify-center"><Button variant="brand" size="lg" onClick={onFind} disabled={busy || situation.trim().length < 20}><Sparkles className="size-4" />{busy ? "Finding the shape…" : "Find my direction"}</Button></div>
    </StageFrame>
  );
}

export function MapStage({ draft, onNext, busy }: { draft: CompassDraftV2; onNext: () => void; busy: boolean }) {
  return (
    <StageFrame eyebrow="Compass Map" title="Here’s what I’m seeing" description="Let’s lay everything out before we try to make any decisions.">
      <p className="max-w-2xl text-base leading-7 text-muted-foreground">{draft.map?.overview}</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {draft.map?.sections.map((section, index) => (
          <article key={section.id} className="compass-card compass-reveal rounded-lg border border-border bg-background/40 p-5" style={{ animationDelay: `${index * 80}ms` }}>
            <p className="text-xs font-semibold uppercase text-primary">{section.label}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.insight}</p>
          </article>
        ))}
      </div>
      <StageAction label="Find the questions that matter" busyLabel="Finding the missing pieces…" busy={busy} onClick={onNext} />
    </StageFrame>
  );
}

export function QuestionsStage({ draft, onAnswer, onContinue, busy }: { draft: CompassDraftV2; onAnswer: (id: string, answer: string, skipped: boolean) => void; onContinue: () => void; busy: boolean }) {
  return (
    <StageFrame eyebrow="Missing pieces" title="A few things I’d like to know" description="Answer what you can. Skip anything you’re not sure about — that’s okay.">
      <div className="space-y-4">
        {draft.questions?.map((question, index) => {
          const existing = answerFor(draft.answers, question.id);
          return (
          <article key={question.id} className="compass-card rounded-lg border border-border bg-background/40 p-5">
              <div className="flex gap-3"><span className="text-sm text-primary">0{index + 1}</span><div className="min-w-0 flex-1"><h3 className="font-display text-base font-semibold leading-6">{question.question}</h3><p className="mt-1 text-xs text-muted-foreground">{question.why_it_matters}</p></div></div>
              <Textarea className="mt-4 bg-background/40" rows={3} maxLength={1600} value={existing?.answer ?? ""} disabled={existing?.skipped} placeholder="Your answer…" onChange={(event) => onAnswer(question.id, event.target.value, false)} />
              <Button className="mt-2" variant="ghost" size="sm" onClick={() => onAnswer(question.id, "", !existing?.skipped)}>{existing?.skipped ? "Answer this question" : "Skip for now"}</Button>
            </article>
          );
        })}
      </div>
      <StageAction label="Discover what’s underneath" busyLabel="Reading the signals…" busy={busy} onClick={onContinue} />
    </StageFrame>
  );
}

export function DiscoveryStageView({ draft, onNext, busy }: { draft: CompassDraftV2; onNext: () => void; busy: boolean }) {
  const discovery = draft.discovery;
  return <StageFrame eyebrow="Discovery" title="Here’s what stood out" description="Sometimes the real decision sits just underneath the first one.">
    <div className="grid gap-4 md:grid-cols-2"><Insight title="At first, this looked like…" text={discovery?.apparent_decision} /><Insight title="There might be something deeper going on" text={discovery?.deeper_conflict} emphasis /></div>
    <BulletList title="What made me think this" items={discovery?.signals ?? []} />
    {discovery?.uncertainty && <div className="compass-card mt-5 rounded-lg border border-lavender/30 bg-background/40 p-5"><p className="text-xs font-semibold uppercase text-lavender">One thing we still don’t know</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{discovery.uncertainty}</p></div>}
    <StageAction label="See my options" busyLabel="Thinking through your options…" busy={busy} onClick={onNext} />
  </StageFrame>;
}

export function PathsStage({ draft, onNext, busy }: { draft: CompassDraftV2; onNext: () => void; busy: boolean }) {
  return <StageFrame eyebrow="Paths" title="What you could do from here" description="A few realistic ways forward, and what each one would mean.">
    <div className="grid gap-4 lg:grid-cols-2">{draft.paths?.map((path) => <article key={path.id} className="compass-card rounded-lg border border-border bg-background/40 p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-display text-lg font-semibold">{path.name}</h3>{path.is_alternative && <span className="rounded-full border border-lavender/40 px-2 py-1 text-[0.65rem] text-lavender">A different angle</span>}</div><p className="mt-2 text-sm leading-6 text-muted-foreground">{path.description}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><BulletList title="What you gain" items={path.gains} compact /><BulletList title="What it costs" items={path.costs} compact /></div></article>)}</div>
    <StageAction label="Pressure-test these paths" busyLabel="Testing the trade-offs…" busy={busy} onClick={onNext} />
  </StageFrame>;
}

export function PressureStage({ draft, onNext, busy }: { draft: CompassDraftV2; onNext: () => void; busy: boolean }) {
  return <StageFrame eyebrow="Pressure Test" title="The difficult part" description="Let’s be honest about what each option actually asks of you.">
    <div className="space-y-4">{draft.pressure_test?.paths.map((path) => <details key={path.path_id} className="compass-card group rounded-lg border border-border bg-background/40 p-5" open><summary className="cursor-pointer list-none font-display font-semibold">{path.path_name}</summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{path.lenses.map((lens) => <div key={lens.lens} className="border-l border-primary/50 pl-4"><p className="text-xs font-semibold uppercase text-primary">{lens.lens}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{lens.insight}</p>{lens.pressure_point && <p className="mt-2 text-xs text-foreground">The hard part: {lens.pressure_point}</p>}</div>)}</div></details>)}</div>
    <StageAction label="Look a little ahead" busyLabel="Picturing what could happen…" busy={busy} onClick={onNext} />
  </StageFrame>;
}

export function FutureStage({ draft, onReact, onNext, busy }: { draft: CompassDraftV2; onReact: (pathId: string, reaction: FutureReaction) => void; onNext: () => void; busy: boolean }) {
  return <StageFrame eyebrow="Future Glance" title="A few weeks from now…" description="Not a prediction. Just a way to explore where each path could lead.">
    <div className="space-y-4">{draft.future_glance?.scenarios.map((scenario) => <article key={scenario.path_id} className="compass-card rounded-lg border border-border bg-background/40 p-5"><p className="text-xs font-semibold uppercase text-primary">{scenario.timeframe}</p><h3 className="mt-2 font-display text-lg font-semibold">{scenario.path_name}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{scenario.scenario}</p><div className="mt-4 flex flex-wrap gap-2"><Reaction active={draft.reactions?.[scenario.path_id] === "right"} icon={Heart} label="This feels right" onClick={() => onReact(scenario.path_id, "right")} /><Reaction active={draft.reactions?.[scenario.path_id] === "unsure"} icon={CircleHelp} label="I’m unsure" onClick={() => onReact(scenario.path_id, "unsure")} /><Reaction active={draft.reactions?.[scenario.path_id] === "not_me"} icon={X} label="This doesn’t feel like me" onClick={() => onReact(scenario.path_id, "not_me")} /></div></article>)}</div>
    <StageAction label="Find my North" busyLabel="Bringing it together…" busy={busy} onClick={onNext} />
  </StageFrame>;
}

export function NorthStage({ draft, saved, progressCreated, onSave, onProgress, onReturn, onNew, busy }: { draft: CompassDraftV2; saved: boolean; progressCreated: boolean; onSave: () => void; onProgress: () => void; onReturn: () => void; onNew: () => void; busy: boolean }) {
  const north = draft.north;
  return <StageFrame eyebrow="Your North" title="Your direction for now" description="Based on everything you’ve shared. The choice is still yours.">
    <div className="compass-card compass-north rounded-lg border border-primary/30 p-6 sm:p-8"><Compass className="size-7 text-primary" /><p className="mt-5 font-display text-xl font-semibold leading-8 sm:text-2xl">{north?.direction}</p><p className="mt-4 text-sm leading-7 text-muted-foreground">{north?.why_it_fits}</p></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2"><Insight title="What you’d be giving up" text={north?.trade_off} /><BulletList title="What we’re assuming" items={north?.assumptions ?? []} /></div>
    <div className="compass-card mt-5 rounded-lg border border-lavender/40 bg-lavender/5 p-5"><h3 className="font-display font-semibold">When you might want to rethink this</h3><p className="mt-1 text-xs text-muted-foreground">This direction is based on what you know today.</p><BulletList title="It might make sense to reconsider if…" items={north?.change_conditions ?? []} compact /></div>
    <div className="mt-5 border-l-2 border-primary pl-5"><p className="text-xs font-semibold uppercase text-primary">Your next move</p><p className="mt-1 text-xs text-muted-foreground">Don’t try to solve everything at once.</p><p className="mt-2 font-medium">{north?.next_move}</p></div>
    <div className="mt-8 flex flex-wrap gap-3"><Button variant="brand" onClick={onSave} disabled={saved || busy}>{saved ? "Saved to History" : "Save direction"}</Button><Button variant="outline" onClick={onProgress} disabled={progressCreated || !north?.next_move}>{progressCreated ? "Added to Progress" : "Create Progress item"}</Button><Button variant="ghost" onClick={onReturn}><ArrowLeft className="size-4" />Return to Compass</Button><Button variant="ghost" onClick={onNew}>Start a new session<ArrowRight className="size-4" /></Button></div>
  </StageFrame>;
}

function StageFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <section className="compass-stage surface-panel mx-auto max-w-5xl overflow-hidden p-5 sm:p-8"><div className="mb-7 max-w-3xl"><p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p><h2 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>{children}</section>;
}

function StageAction({ label, busyLabel, busy, onClick }: { label: string; busyLabel: string; busy: boolean; onClick: () => void }) { return <div className="mt-8 flex justify-center"><Button variant="brand" size="lg" onClick={onClick} disabled={busy}>{busy ? busyLabel : label}<ArrowRight className="size-4" /></Button></div>; }
function Insight({ title, text, emphasis = false }: { title: string; text: string | undefined; emphasis?: boolean }) { return <div className={cn("compass-card rounded-lg border border-border bg-background/40 p-5", emphasis && "border-primary/30")}><p className="text-xs font-semibold uppercase text-primary">{title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>; }
function BulletList({ title, items, compact = false }: { title: string; items: string[]; compact?: boolean }) { if (!items.length) return null; return <div className={compact ? "mt-3" : "mt-5"}><h3 className="text-sm font-semibold">{title}</h3><ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">{items.map((item, index) => <li key={`${title}-${index}`} className="flex gap-2"><span className="text-primary">·</span><span>{item}</span></li>)}</ul></div>; }
function Reaction({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Heart; label: string; onClick: () => void }) { return <Button variant={active ? "secondary" : "outline"} size="sm" onClick={onClick} aria-pressed={active}><Icon className="size-3.5" />{label}</Button>; }
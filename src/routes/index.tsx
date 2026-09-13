import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Compass, Rocket, Search } from "lucide-react";

import { CompassDial } from "@/components/brand/CompassDial";
import { Logo } from "@/components/brand/Logo";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Z-COMPASS — Find your direction" },
      {
        name: "description",
        content:
          "Capture what's on your mind, explore your options, remember what matters and turn a decision into progress. Z-COMPASS helps you think; you choose the path.",
      },
      { property: "og:title", content: "Z-COMPASS — Find your direction" },
      {
        property: "og:description",
        content:
          "A personal compass for clarity, decisions and progress. Think clearly, choose a direction, move forward.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const pillars = [
  {
    icon: Brain,
    title: "Clarity",
    body: "Put the thought down exactly as it sits in your head. No structure required, no blank-page pressure.",
  },
  {
    icon: Compass,
    title: "Decisions",
    body: "A guided path through your situation: the right questions, your priorities, your options, your trade-offs.",
  },
  {
    icon: Search,
    title: "Remember",
    body: "Keep the details your future self will want — and find them again in seconds.",
  },
  {
    icon: Rocket,
    title: "Progress",
    body: "Turn a direction into a few real steps, then come back later and reflect on how it went.",
  },
];

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-halo">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-drift-in">
              <p className="text-xs uppercase tracking-wordmark text-muted-foreground">
                Clarity · Decisions · Progress
              </p>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
                Think clearly.
                <br />
                Choose a direction.
                <br />
                <span className="text-gradient-brand">Move forward.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Z-COMPASS is a quiet place to work out what's on your mind, weigh the options
                against what actually matters to you, and keep the context you'll want later.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button variant="brand" size="xl" asChild>
                  <Link to="/how-it-works">
                    See how it works
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="subtle" size="xl" asChild>
                  <Link to="/support">Talk to us</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                The compass provides direction. You choose the path.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-0 -z-10 rounded-full bg-gradient-brand opacity-20 blur-3xl" />
              <CompassDial className="w-full" />
              <div className="surface-panel absolute inset-x-6 bottom-2 p-4 text-center">
                <Logo variant="full" size="sm" className="justify-center" />
              </div>
            </div>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs uppercase tracking-wordmark text-muted-foreground">
                The problem
              </p>
              <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
                It's rarely a lack of information
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Thoughts scattered across notes, screenshots and messages",
                "Decisions that circle for weeks without resolving",
                "Context you had at the time and can't recall now",
                "Choices you made, with the reasoning long gone",
              ].map((item) => (
                <p
                  key={item}
                  className="surface-panel p-5 text-sm leading-relaxed text-muted-foreground"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* THE FOUR PARTS */}
        <section className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Four connected parts, one loop
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Think, decide, act, reflect — and everything you keep stays searchable.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="surface-panel group p-6 transition-transform hover:-translate-y-1"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-foreground transition-colors group-hover:bg-gradient-brand group-hover:text-primary-foreground">
                    <pillar.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {pillar.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPASS ENGINE */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wordmark text-muted-foreground">
                The Compass Engine
              </p>
              <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
                Better thinking, not answers handed down
              </h2>
              <p className="mt-5 text-muted-foreground">
                Rather than a chat box, the Compass Engine walks a structured path: it asks what it
                genuinely needs to know about your situation, helps you name the priorities that
                matter, lays your options side by side, and ends with a clear read of where things
                point — and what you'd be giving up.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {[
                  "Questions shaped by your situation, not a fixed checklist",
                  "Priorities you weight yourself",
                  "Trade-offs stated plainly, alternatives kept on the table",
                  "A recommendation you can disagree with",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gradient-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-panel p-7">
              <p className="text-xs uppercase tracking-wordmark text-muted-foreground">
                Your compass points toward
              </p>
              <p className="mt-3 font-display text-2xl font-semibold text-gradient-brand">
                A steadier first step
              </p>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="font-medium">What mattered most</p>
                  <p className="mt-1 text-muted-foreground">
                    Long-term growth, the time you actually have, and staying financially steady.
                  </p>
                </div>
                <div>
                  <p className="font-medium">A possible trade-off</p>
                  <p className="mt-1 text-muted-foreground">
                    Slower momentum in the first months in exchange for a base you can build on.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Your next step</p>
                  <p className="mt-1 text-muted-foreground">
                    Give it two focused evenings this week, then review how it felt.
                  </p>
                </div>
              </div>
              <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
                An illustration of a Compass result. Your own results reflect the priorities you
                choose.
              </p>
            </div>
          </div>
        </section>

        {/* REMEMBER + PROGRESS */}
        <section className="border-t border-border/60 bg-surface/40">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-20 lg:grid-cols-2">
            <div className="surface-panel p-8">
              <h2 className="font-display text-2xl font-semibold">
                Give your future self the context you have now
              </h2>
              <p className="mt-4 text-muted-foreground">
                Where the spare key is. Why the client picked the second design. What made that
                restaurant worth returning to. Save it once, find it whenever you need it.
              </p>
            </div>
            <div className="surface-panel p-8">
              <h2 className="font-display text-2xl font-semibold">
                A decision only counts once it moves
              </h2>
              <p className="mt-4 text-muted-foreground">
                Turn a direction into a few honest next steps, track where each one stands, and
                write down what you learned when the dust settles.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-halo">
          <div className="mx-auto w-full max-w-3xl px-5 py-24 text-center">
            <Logo variant="mark" size="lg" className="justify-center" />
            <h2 className="mt-8 font-display text-3xl font-semibold sm:text-4xl">
              Every direction begins with a question
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Bring the one that's been sitting with you.
            </p>
            <Button variant="brand" size="xl" className="mt-8" asChild>
              <Link to="/auth">
                Begin
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

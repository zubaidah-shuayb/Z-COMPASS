import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Compass, Rocket, RotateCcw, Search, Target } from "lucide-react";

import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Z-COMPASS works — from a thought to a direction" },
      {
        name: "description",
        content:
          "Capture what's on your mind, explore your options, decide with your own priorities, remember what matters, move forward and reflect.",
      },
      { property: "og:title", content: "How Z-COMPASS works" },
      {
        property: "og:description",
        content:
          "The Z-COMPASS journey: clarity, exploration, decision, memory, progress and reflection.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorksPage,
});

const steps = [
  {
    icon: Brain,
    eyebrow: "01",
    title: "Clarity",
    body: "Start with what's actually on your mind — a thought, a question, a problem, a situation. Nothing to structure, nothing to format.",
  },
  {
    icon: Compass,
    eyebrow: "02",
    title: "Explore",
    body: "The Compass Engine asks questions that fit your situation, not a generic checklist, and helps you lay out the options you're weighing.",
  },
  {
    icon: Target,
    eyebrow: "03",
    title: "Decide",
    body: "Weight the priorities that matter to you and see how each option lines up. Z-COMPASS helps you think. You make the final decision.",
  },
  {
    icon: Search,
    eyebrow: "04",
    title: "Remember",
    body: "Save the context your future self will need — where something is, why you chose what you chose, what somebody preferred. Find it later in a second.",
  },
  {
    icon: Rocket,
    eyebrow: "05",
    title: "Move forward",
    body: "Turn a direction into a small number of real next steps and keep track of where each one stands.",
  },
  {
    icon: RotateCcw,
    eyebrow: "06",
    title: "Reflect",
    body: "Come back later. See the reasoning as it was at the time, note what actually happened, and carry the lesson into the next decision.",
  },
];

function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-halo">
          <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center sm:py-28">
            <p className="text-xs uppercase tracking-wordmark text-muted-foreground">
              The journey
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              From a thought you can't shake to a <span className="text-gradient-brand">direction</span> you trust
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
              Six steps, in the order people actually think. You can enter anywhere and stop
              anywhere.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-5 pb-24">
          <ol className="relative space-y-4 border-l border-border pl-6 sm:pl-10">
            {steps.map((step) => (
              <li key={step.title} className="relative">
                <span className="absolute -left-[31px] top-7 hidden size-3 rounded-full bg-gradient-brand shadow-glow sm:block" />
                <div className="surface-panel p-6 transition-transform hover:-translate-y-0.5 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-foreground">
                      <step.icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wordmark text-muted-foreground">
                        {step.eyebrow}
                      </p>
                      <h2 className="font-display text-lg font-semibold">{step.title}</h2>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="surface-panel mt-10 p-8 text-center">
            <p className="font-display text-lg font-medium">
              The compass provides direction. You choose the path.
            </p>
            <Button variant="brand" size="lg" className="mt-6" asChild>
              <Link to="/">Start with one thought</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

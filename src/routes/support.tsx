import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";

import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SUPPORT_EMAIL } from "@/lib/constants";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Z-COMPASS" },
      {
        name: "description",
        content:
          "Get help with your Z-COMPASS account, themes, privacy and the Compass Engine, or email the team directly.",
      },
      { property: "og:title", content: "Support — Z-COMPASS" },
      {
        property: "og:description",
        content: "Answers to common questions, plus a direct line to the Z-COMPASS team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

const faqs = [
  {
    q: "Who can see what I write?",
    a: "Only you. Every entry, decision, memory and reflection is tied to your account and protected at the database level, so no other user can read or change it.",
  },
  {
    q: "Does Z-COMPASS decide for me?",
    a: "No. The Compass Engine helps you understand your situation, your priorities and your trade-offs. The final choice is always yours, and the wording throughout reflects that.",
  },
  {
    q: "Is Z-COMPASS a substitute for professional advice?",
    a: "No. For medical, legal, financial or mental-health matters, please speak with a qualified professional. Z-COMPASS supports your thinking; it does not claim professional authority.",
  },
  {
    q: "Can I change the appearance?",
    a: "Yes. Light, dark and system themes are available anywhere in the app, and your choice is remembered on your device.",
  },
  {
    q: "What happens to an unfinished Compass session?",
    a: "It is saved as a draft automatically. You can leave, come back and pick up where you stopped. Only sessions you explicitly save become part of your history.",
  },
  {
    q: "How do I get help with my account?",
    a: `Email ${SUPPORT_EMAIL} with a short description of the problem. Include the email address on your account so we can find it quickly.`,
  },
];

function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-halo">
          <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center sm:py-24">
            <p className="text-xs uppercase tracking-wordmark text-muted-foreground">Support</p>
            <h1 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">
              We're one message away
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              Questions about your account, the Compass Engine or your privacy — send us a note and
              we'll come back to you.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button variant="brand" size="lg" asChild>
                <a href={`mailto:${SUPPORT_EMAIL}`}>
                  <Mail className="size-4" />
                  Email support
                </a>
              </Button>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-5 pb-24">
          <h2 className="font-display text-2xl font-semibold">Frequently asked</h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

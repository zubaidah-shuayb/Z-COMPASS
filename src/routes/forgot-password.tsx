import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Z-COMPASS" },
      { name: "description", content: "Request a password reset link for your Z-COMPASS account." },
      { property: "og:title", content: "Reset your password — Z-COMPASS" },
      { property: "og:description", content: "Request a password reset link for your Z-COMPASS account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-halo px-5 py-14">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto flex w-fit">
          <Logo variant="full" size="md" />
        </Link>
        <div className="surface-panel mt-8 p-7">
          {sent ? (
            <div className="space-y-3 text-center">
              <h1 className="font-display text-xl font-semibold">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                If an account exists for {email}, a reset link is on its way.
              </p>
              <Button variant="subtle" className="mt-2" asChild>
                <Link to="/auth">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                setBusy(false);
                if (error) {
                  toast.error(error.message);
                  return;
                }
                setSent(true);
              }}
            >
              <div>
                <h1 className="font-display text-xl font-semibold">Reset your password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your email and we'll send you a link to set a new one.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" variant="brand" size="lg" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </Button>
              <Link
                to="/auth"
                className="block text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

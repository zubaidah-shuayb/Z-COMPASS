import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Z-COMPASS" },
      { name: "description", content: "Set a new password for your Z-COMPASS account." },
      { property: "og:title", content: "Choose a new password — Z-COMPASS" },
      { property: "og:description", content: "Set a new password for your Z-COMPASS account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-halo px-5 py-14">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto flex w-fit">
          <Logo variant="full" size="md" />
        </Link>
        <form
          className="surface-panel mt-8 space-y-4 p-7"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password.length < 8) {
              toast.error("Use at least 8 characters.");
              return;
            }
            if (password !== confirm) {
              toast.error("Those two passwords don't match.");
              return;
            }
            setBusy(true);
            const { error } = await supabase.auth.updateUser({ password });
            setBusy(false);
            if (error) {
              toast.error(
                error.message.toLowerCase().includes("session")
                  ? "This reset link has expired. Request a new one."
                  : error.message,
              );
              return;
            }
            toast.success("Password updated.");
            void navigate({ to: "/dashboard", replace: true });
          }}
        >
          <div>
            <h1 className="font-display text-xl font-semibold">Choose a new password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick something you'll remember — at least 8 characters.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="brand" size="lg" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

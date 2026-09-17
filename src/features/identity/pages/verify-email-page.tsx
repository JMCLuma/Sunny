import { Link } from "@tanstack/react-router";
import { CircleCheckBig, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AuthShell } from "../components/auth-shell";
import { Callout } from "../components/callout";
import type { VerificationState } from "../search";

/**
 * Email verification, pending and complete.
 *
 * The distinction this screen has to hold on to is narrow and keeps getting
 * lost: verifying an address proves control of an inbox. That is all. It is
 * not evidence that someone is a parent of the child they just added, and it
 * is not a program role — both of those are established elsewhere, by a
 * relationship check and by an invitation from JMC respectively.
 *
 * Getting that wrong is how a stranger with a plausible email ends up holding
 * a guardian's permissions, so the boundary is stated on the screen where the
 * confusion starts rather than buried in a policy page.
 */
export function VerifyEmailPage({
  state,
  email,
  onResend,
}: {
  state: VerificationState;
  email: string | null;
  onResend: () => void;
}) {
  const address = email ?? "the address you signed up with";

  return (
    <AuthShell
      title={state === "verified" ? "Email verified" : "Check your email"}
      lead={
        state === "verified"
          ? "That address is confirmed as yours. Next comes the part that actually sets up your household."
          : `We sent a verification link to ${address}. It expires in 24 hours.`
      }
      footer={
        <p>
          Wrong address?{" "}
          <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
            Start again
          </Link>{" "}
          — nothing has been created yet.
        </p>
      }
    >
      {state === "verified" ? (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <CircleCheckBig aria-hidden className="size-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Your account exists and it is empty. The next few questions set up the household — where
            you are, and who you are applying for.
          </p>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <Link to="/onboarding">Set up your household</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <MailCheck aria-hidden className="size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing else happens until the link is opened. You can close this page; the link works
            from any device.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={onResend}>
              Resend the email
            </Button>
            {/* The wireframe has no inbox, so the demo needs a way to be the
                person who clicked the link. Labelled as such rather than
                disguised as a real "I have verified" button. */}
            <Button asChild variant="outline">
              <Link to="/verify-email" search={{ state: "verified" }}>
                Simulate opening the link
              </Link>
            </Button>
          </div>
        </div>
      )}

      <Callout tone="privacy" title="What verifying proves — and what it does not">
        <p>It proves you can receive mail at {address}. Nothing more.</p>
        <ul className="mt-2 list-disc space-y-1 ps-5">
          <li>
            It does <strong>not</strong> make you anyone&rsquo;s guardian. Adding a child to your
            household is something you assert; whether it is accepted is checked separately, and a
            camp will not release a health record on the strength of an email address.
          </li>
          <li>
            It does <strong>not</strong> give you a staff or reviewer role. Those arrive as an
            invitation from JMC and are attached to a record, not to an inbox.
          </li>
          <li>
            It does <strong>not</strong> unlock records that already exist. Connecting to those is a
            separate check you will see the result of.
          </li>
        </ul>
      </Callout>

      <Callout tone="info" title="Why it is worth doing anyway">
        <p>
          A verified address is the strongest evidence a link can be made on without a person
          checking it — an invitation sent to an address you proved you own can only be you. It is
          why some households connect to their history instantly and others wait on a review.
        </p>
      </Callout>
    </AuthShell>
  );
}

import { Link } from "@tanstack/react-router";
import { KeyRound, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AuthShell } from "../components/auth-shell";
import { Callout } from "../components/callout";

/**
 * Creating a login.
 *
 * The screen has one job beyond collecting an email, and it is the one most
 * signup screens skip: setting expectations about what the account *is*. A
 * parent who signs up expecting to find their child's camp history and finds
 * an empty household concludes the system lost their records. The truth —
 * signing up proves you own an email address and nothing else, and records
 * connect afterwards through a check we run deliberately — has to be said
 * here, before the disappointment, not in a support reply after it.
 *
 * Both sign-in methods are offered because the demo audience asked for the
 * passwordless one and it changes the flow: a link is also the strongest
 * matching evidence there is, since it was sent to an address rather than
 * typed by whoever is at the keyboard.
 */
export function SignupPage({ onSubmitted }: { onSubmitted: (email: string) => void }) {
  const [email, setEmail] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitted(email);
  }

  return (
    <AuthShell
      title="Create your Luma account"
      lead="One account holds your whole household. You add each person you will apply for, and switch between them rather than keeping a separate login per child."
      footer={
        <p>
          Already have an account?{" "}
          <Link to="/my" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
          .
        </p>
      }
    >
      <Tabs defaultValue="password">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">
            <KeyRound aria-hidden className="me-2 size-4" />
            Email and password
          </TabsTrigger>
          <TabsTrigger value="link">
            <Mail aria-hidden className="me-2 size-4" />
            Email me a link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <EmailField value={email} onChange={setEmail} />
            <div>
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="mt-1"
                placeholder="At least 12 characters"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Length does more than symbols do. A phrase you will remember beats a short password
                you will reset every August.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="link">
          <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <EmailField value={email} onChange={setEmail} />
            <Button type="submit" className="w-full">
              Email me a sign-in link
            </Button>
            <p className="text-xs text-muted-foreground">
              No password to forget. Every sign-in sends a fresh link, which also means the address
              below is the account — changing it later is a support request, not a settings toggle.
            </p>
          </form>
        </TabsContent>
      </Tabs>

      <Callout tone="privacy" title="What this account gives you">
        <p>
          A new account starts empty and self-service. It lets you add people to your household,
          apply on their behalf, and complete what a camp asks for afterwards.
        </p>
        <p className="mt-2">
          It does <strong>not</strong> open anyone&rsquo;s existing records. If your child has been
          to a JMC camp before, that history is attached to a record we hold, and connecting the two
          is a separate, deliberate step — sometimes automatic, sometimes checked by a person. You
          will see exactly which happened.
        </p>
      </Callout>

      <Callout tone="info" title="What we ask for, and what we do not">
        <p>
          Household details are a phone number and a city, state and ZIP — no street address. It was
          dropped from the application because nothing read it; a camp that needs a full address for
          a health form collects it there, where there is a reason to hold it.
        </p>
      </Callout>
    </AuthShell>
  );
}

function EmailField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label htmlFor="signup-email">Email address</Label>
      <Input
        id="signup-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="mt-1"
        placeholder="you@example.com"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Use an address you keep. It is how a camp reaches you, and how an invitation from a second
        guardian finds you later.
      </p>
    </div>
  );
}

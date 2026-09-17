import { Check, ChevronRight, MapPin, UserRound, Users } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Account, MatchOutcome } from "@/features/operations/domain";
import type { ProfileDraft } from "@/features/operations/data";
import { cn } from "@/lib/utils";

import {
  filterJamatkhanas,
  isPlausiblePostalCode,
  isPlausibleStateCode,
} from "../account-catalogue";
import { MatchOutcomeCard } from "../components/match-outcome-card";
import { ProfileFormFields } from "../components/profile-form-fields";
import { emptyProfileDraft, validateProfileDraft } from "../profile-draft";
import { MATCH_OUTCOMES } from "../match-outcomes";
import { ONBOARDING_STEP_COUNT } from "../search";

/** Free household facts the account form collects — see `Account` in identity.ts. */
export interface AccountBasicsDraft {
  readonly phone: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly jamatkhana: string;
}

function emptyBasics(account: Account | null): AccountBasicsDraft {
  return {
    phone: account?.phone ?? "",
    city: account?.city ?? "",
    state: account?.state ?? "",
    postalCode: account?.postalCode ?? "",
    jamatkhana: account?.jamatkhana ?? "",
  };
}

type WhoFor = "self" | "child" | "both";

const STEP_TITLES = [
  "Household basics",
  "Who is this for?",
  "Add your first profile",
  "You're set up",
];

/**
 * The short guided flow between "email verified" and "the household exists".
 *
 * Three real steps and a fourth that is arguably the point of the whole
 * screen: it tells the family the truth about what just happened to the
 * profile they added, including the one truth a friendlier design would
 * hide — that an uncertain match shows them nothing about the record it
 * might be. See `match-outcomes.ts`.
 */
export function OnboardingPage({
  step,
  account,
  previewOnly,
  onStepChange,
  onSubmitProfile,
  onFinish,
}: {
  step: number;
  account: Account | null;
  /** True when this persona has no household to actually write to. */
  previewOnly: boolean;
  onStepChange: (step: number) => void;
  onSubmitProfile: (draft: ProfileDraft) => Promise<MatchOutcome>;
  onFinish: () => void;
}) {
  const [basics, setBasics] = useState<AccountBasicsDraft>(() => emptyBasics(account));
  const [whoFor, setWhoFor] = useState<WhoFor>("child");
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clampedStep = Math.min(Math.max(step, 1), ONBOARDING_STEP_COUNT);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateProfileDraft(draft);
    if (!validation.valid) return;
    setSubmitting(true);
    try {
      const result = await onSubmitProfile(draft);
      setOutcome(result);
      onStepChange(4);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      <header className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">Luma</span>
          <span className="text-xs text-muted-foreground">Jubilee Monuments</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Set up your household</h1>
        <StepDots current={clampedStep} />
      </header>

      {previewOnly ? (
        <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Previewing this flow without a signed-in household — nothing on this screen is saved.
          Switch to the Parent persona in the demo bar to run it for real.
        </div>
      ) : null}

      {clampedStep === 1 ? (
        <BasicsStep value={basics} onChange={setBasics} onNext={() => onStepChange(2)} />
      ) : null}

      {clampedStep === 2 ? (
        <WhoForStep
          value={whoFor}
          onChange={setWhoFor}
          onBack={() => onStepChange(1)}
          onNext={() => onStepChange(3)}
        />
      ) : null}

      {clampedStep === 3 ? (
        <ProfileStep
          draft={draft}
          onChange={setDraft}
          whoFor={whoFor}
          submitting={submitting}
          onBack={() => onStepChange(2)}
          onSubmit={handleProfileSubmit}
        />
      ) : null}

      {clampedStep === 4 && outcome ? <OutcomeStep outcome={outcome} onFinish={onFinish} /> : null}
    </div>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEP_TITLES.map((title, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < current;
        const active = stepNumber === current;
        return (
          <li key={title} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-primary text-primary-foreground",
                active && "bg-secondary text-secondary-foreground ring-2 ring-primary/40",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check aria-hidden className="size-3.5" /> : stepNumber}
            </span>
            <span className={cn("hidden truncate text-xs sm:inline", active && "font-semibold")}>
              {title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function BasicsStep({
  value,
  onChange,
  onNext,
}: {
  value: AccountBasicsDraft;
  onChange: (value: AccountBasicsDraft) => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState(value.jamatkhana);
  const matches = useMemo(() => filterJamatkhanas(query), [query]);
  const valid =
    value.phone.trim().length > 0 &&
    value.city.trim().length > 0 &&
    isPlausibleStateCode(value.state) &&
    isPlausiblePostalCode(value.postalCode);

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onNext();
      }}
    >
      <div className="flex items-center gap-2">
        <MapPin aria-hidden className="size-4 text-muted-foreground" />
        <h2 className="text-base font-bold">Where is your household?</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        No street address here — city, state and ZIP are enough to apply. A full address is
        collected later on the health form, where there is a reason to hold it.
      </p>

      <div>
        <Label htmlFor="ob-phone">Phone</Label>
        <Input
          id="ob-phone"
          className="mt-1"
          value={value.phone}
          onChange={(event) => onChange({ ...value, phone: event.target.value })}
          placeholder="555-0100"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 sm:col-span-1">
          <Label htmlFor="ob-city">City</Label>
          <Input
            id="ob-city"
            className="mt-1"
            value={value.city}
            onChange={(event) => onChange({ ...value, city: event.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="ob-state">State</Label>
          <Input
            id="ob-state"
            className="mt-1 uppercase"
            maxLength={2}
            value={value.state}
            onChange={(event) => onChange({ ...value, state: event.target.value.toUpperCase() })}
            required
          />
        </div>
        <div>
          <Label htmlFor="ob-zip">ZIP</Label>
          <Input
            id="ob-zip"
            className="mt-1"
            value={value.postalCode}
            onChange={(event) => onChange({ ...value, postalCode: event.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="ob-jamatkhana">Home Jamatkhana</Label>
        <Input
          id="ob-jamatkhana"
          className="mt-1"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange({ ...value, jamatkhana: "" });
          }}
          placeholder="Start typing a name or region…"
        />
        {query.trim().length > 0 && value.jamatkhana === "" ? (
          <ul className="mt-1 max-h-48 space-y-0.5 overflow-y-auto rounded-md border border-border bg-popover p-1 text-sm shadow-sm">
            {matches.length === 0 ? (
              <li className="px-2 py-1.5 text-muted-foreground">
                No matches — you can adjust this later.
              </li>
            ) : (
              matches.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className="w-full rounded-sm px-2 py-1.5 text-start hover:bg-accent"
                    onClick={() => {
                      onChange({ ...value, jamatkhana: option.label });
                      setQuery(option.label);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
        {value.jamatkhana ? (
          <p className="mt-1 text-xs text-muted-foreground">Selected: {value.jamatkhana}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={!valid}>
        Continue
        <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
      </Button>
    </form>
  );
}

function WhoForStep({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: WhoFor;
  onChange: (value: WhoFor) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Users aria-hidden className="size-4 text-muted-foreground" />
        <h2 className="text-base font-bold">Who are you here for?</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        This only shapes what we ask next — you can add more people to the household later, and
        switch between them from one account.
      </p>

      <RadioGroup value={value} onValueChange={(next) => onChange(next as WhoFor)}>
        <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
          <RadioGroupItem value="self" id="whofor-self" className="mt-0.5" />
          <span>
            <span className="block font-semibold">Myself</span>
            <span className="block text-sm text-muted-foreground">
              I'll apply for a role or program as an adult participant.
            </span>
          </span>
        </Label>
        <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
          <RadioGroupItem value="child" id="whofor-child" className="mt-0.5" />
          <span>
            <span className="block font-semibold">A child or dependent</span>
            <span className="block text-sm text-muted-foreground">
              I'll add them to my household and apply on their behalf.
            </span>
          </span>
        </Label>
        <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
          <RadioGroupItem value="both" id="whofor-both" className="mt-0.5" />
          <span>
            <span className="block font-semibold">Both, over time</span>
            <span className="block text-sm text-muted-foreground">
              Start with one profile now — add the rest whenever you're ready.
            </span>
          </span>
        </Label>
      </RadioGroup>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onBack} className="sm:w-auto">
          Back
        </Button>
        <Button type="button" onClick={onNext} className="flex-1">
          Continue
          <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}

function ProfileStep({
  draft,
  onChange,
  whoFor,
  submitting,
  onBack,
  onSubmit,
}: {
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
  whoFor: WhoFor;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const validation = validateProfileDraft(draft);

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6"
      onSubmit={onSubmit}
    >
      <div className="flex items-center gap-2">
        <UserRound aria-hidden className="size-4 text-muted-foreground" />
        <h2 className="text-base font-bold">
          {whoFor === "self" ? "Add yourself" : "Add your first profile"}
        </h2>
      </div>

      <ProfileFormFields draft={draft} onChange={onChange} idPrefix="ob" />

      {validation.warnings.length > 0 ? (
        <ul className="space-y-1 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          {validation.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onBack} className="sm:w-auto">
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={!validation.valid || submitting}>
          {submitting ? "Checking for existing records…" : "Add this profile"}
        </Button>
      </div>
    </form>
  );
}

function OutcomeStep({ outcome, onFinish }: { outcome: MatchOutcome; onFinish: () => void }) {
  return (
    <div className="space-y-4">
      <MatchOutcomeCard outcome={outcome} highlight />

      <details className="rounded-lg border border-dashed border-border p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-foreground">
          What the other outcomes would have said
        </summary>
        <p className="mt-2 text-muted-foreground">
          Matching runs the same check every time; only the strength of the evidence changes which
          of these four happens.
        </p>
        <div className="mt-3 space-y-3">
          {MATCH_OUTCOMES.filter((candidate) => candidate !== outcome).map((candidate) => (
            <MatchOutcomeCard key={candidate} outcome={candidate} />
          ))}
        </div>
      </details>

      <Button type="button" className="w-full" onClick={onFinish}>
        Go to My Luma
      </Button>
    </div>
  );
}

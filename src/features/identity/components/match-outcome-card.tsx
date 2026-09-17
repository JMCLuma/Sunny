import type { MatchOutcome } from "@/features/operations/domain";
import { cn } from "@/lib/utils";

import { describeMatchOutcome, type MatchTone } from "../match-outcomes";
import { Callout, type CalloutTone } from "./callout";

/**
 * One matching outcome, explained.
 *
 * Shared between onboarding (where it announces what just happened to a new
 * profile) and the household screen (where a `pending_match` profile sits in
 * its review state indefinitely). Both places need the exact same honesty
 * rule enforced, so the copy lives in `match-outcomes.ts` and this component
 * only chooses how to draw it.
 */
const TONE_MAP: Readonly<Record<MatchTone, CalloutTone>> = {
  linked: "assurance",
  created: "info",
  held: "privacy",
};

export function MatchOutcomeCard({
  outcome,
  highlight = false,
}: {
  outcome: MatchOutcome;
  /** True when this is the outcome that actually happened, not a "what if". */
  highlight?: boolean;
}) {
  const copy = describeMatchOutcome(outcome);

  return (
    <Callout
      tone={TONE_MAP[copy.tone]}
      title={copy.title}
      className={cn(highlight && "ring-2 ring-primary/50")}
    >
      <p>{copy.body}</p>
      <p className="mt-2">
        <strong>Next: </strong>
        {copy.next}
      </p>
      {copy.withheld ? (
        <p className="mt-2 border-s-2 border-primary/30 ps-3 text-xs italic">{copy.withheld}</p>
      ) : null}
    </Callout>
  );
}

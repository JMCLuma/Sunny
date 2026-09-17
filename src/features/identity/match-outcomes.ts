import type { MatchOutcome } from "@/features/operations/domain";

/**
 * How each matching outcome is explained to the person who triggered it.
 *
 * The copy is the feature. `identity.ts` states the rule — matching may link,
 * but it may never reveal — and the only place that rule is visible to a user
 * is in what these four screens do or do not say.
 *
 * `uncertain` is the one that matters. A well-meaning product would show "is
 * this you?" with a name and a date of birth attached, and in doing so would
 * hand one family a fact about another on nothing more than a name collision.
 * So the uncertain copy below names no record, no region, no confidence score
 * and no count. It says a person will look, and that nothing is blocked
 * meanwhile — which is everything the applicant needs and nothing they should
 * not have.
 */

export type MatchTone = "linked" | "created" | "held";

export interface MatchOutcomeCopy {
  readonly outcome: MatchOutcome;
  readonly tone: MatchTone;
  /** Headline, written from the family's point of view, not the system's. */
  readonly title: string;
  readonly body: string;
  /** What happens next, whether or not the family has to do anything. */
  readonly next: string;
  /** Present only when the outcome deliberately withholds something. */
  readonly withheld: string | null;
}

const COPY: Readonly<Record<MatchOutcome, MatchOutcomeCopy>> = {
  confirmed: {
    outcome: "confirmed",
    tone: "linked",
    title: "Linked to an existing record",
    body: "We could tell without guessing — an invitation or a verified email pointed at exactly one record — so this profile now shares that history.",
    next: "Past camps, forms already signed and prior staff roles carry over. Nothing needs to be re-entered.",
    withheld: null,
  },
  no_match: {
    outcome: "no_match",
    tone: "created",
    title: "New record created",
    body: "Nothing in our records looked like this person, so we made a fresh one for them.",
    next: "You can apply straight away. If it turns out they were already known to a camp, the two records are merged later — no history is lost by starting here.",
    withheld: null,
  },
  uncertain: {
    outcome: "uncertain",
    tone: "held",
    title: "Sent to a person to check",
    body: "Something in our records is similar, but not similar enough to act on. A name and a date of birth can belong to two different people, and linking the wrong ones would show one family another family's records.",
    next: "A JMC administrator will confirm or reject the link. You are not blocked: the profile works, and you can apply now.",
    withheld:
      "We are deliberately not telling you what we found — not the name, not the region, not how close it was. If the record is not theirs, you should learn nothing about whoever it belongs to.",
  },
  conflict: {
    outcome: "conflict",
    tone: "held",
    title: "Held for review",
    body: "Two of the details you gave point at different existing records. That usually means a shared household phone or an email that has changed hands.",
    next: "A JMC administrator will sort out which record is which. The profile still works in the meantime.",
    withheld:
      "As above: nothing about the possible records is shown here, including whether there is more than one.",
  },
};

export function describeMatchOutcome(outcome: MatchOutcome): MatchOutcomeCopy {
  return COPY[outcome];
}

/**
 * All four, in the order the rules are applied: strongest evidence first.
 * Used by the onboarding explainer, which shows what *could* have happened
 * alongside what did, because a family that only ever sees one branch has no
 * way to know the others exist.
 */
export const MATCH_OUTCOMES: readonly MatchOutcome[] = [
  "confirmed",
  "no_match",
  "uncertain",
  "conflict",
];

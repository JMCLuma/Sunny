/**
 * Decisions the team has not closed yet.
 *
 * Several things in this wireframe had to be decided in order to draw a
 * screen at all, and the team has not actually agreed them. Quietly picking
 * one and rendering it as settled is how a prototype turns into a
 * specification nobody signed off — the 09-09 call reopened the account model
 * twice in ten minutes precisely because no one could see what had been
 * assumed.
 *
 * So each open decision is recorded here with the assumption the wireframe
 * made and where it came from, and the demo can surface them on the screens
 * they affect. The overlay is off by default: the demo should read clean, and
 * then show its working when asked.
 */

export type DecisionStatus = "open" | "assumed" | "decided";

export interface OpenDecision {
  readonly id: string;
  readonly question: string;
  /** What this wireframe does, pending a real answer. */
  readonly assumption: string;
  /** Where the question was raised. */
  readonly source: string;
  readonly status: DecisionStatus;
  /** Route prefixes the decision bears on. */
  readonly surfaces: readonly string[];
}

export const OPEN_DECISIONS: readonly OpenDecision[] = [
  {
    id: "account-model",
    question: "One login per adult, or one login holding a household of profiles?",
    assumption:
      "A login holds a household; you apply as a profile within it. Person stays underneath as the canonical record, so someone who later gets their own login keeps one history.",
    source:
      "09-09 call — Zain demonstrated the household model and Sunny endorsed it; the Person-Linking doc recommends the opposite. Nobody closed it.",
    status: "assumed",
    surfaces: ["/signup", "/onboarding", "/my"],
  },
  {
    id: "terminology",
    question: "Participant, camper, or both?",
    assumption:
      '"Participant" everywhere. Luma 1.0\'s participant/camper split (under and over 18) is carried as data, not vocabulary.',
    source:
      "09-09 call — Rayhaan proposed participant as the generic; Zain flagged that CGS attendees were also called participants and it confused people.",
    status: "assumed",
    surfaces: ["/", "/camps", "/my", "/operations/applications"],
  },
  {
    id: "eligibility-authority",
    question: "Who sets eligibility, and can a camp override a national rule?",
    assumption:
      "Each camp sets its own criteria on the instance, and an applicant matching any one rule qualifies. No national floor is enforced.",
    source:
      "09-09 call — agreed camps set their own criteria; the interaction between camp and national rules was never discussed.",
    status: "open",
    surfaces: ["/my/apply", "/operations/programs"],
  },
  {
    id: "street-address",
    question: "Where is a full address collected, and who may see it?",
    assumption:
      "Not on the application. City, state and ZIP only; the health form collects a full address later.",
    source:
      "09-09 call — Rayhaan and Zain agreed nothing used street address; Rida suggested moving it to the health form.",
    status: "decided",
    surfaces: ["/my/apply", "/my/health"],
  },
  {
    id: "camp-question-limit",
    question: "Should camps be capped on how many questions they may add?",
    assumption: "No hard cap. Camp-specific questions are a separate step so length is visible.",
    source: "09-09 call — Rida asked whether to cap at five to ten; left unanswered.",
    status: "open",
    surfaces: ["/my/apply", "/operations/applications"],
  },
  {
    id: "staff-scope",
    question: "Is the staff application in scope for the first release?",
    assumption:
      "Yes. Participant and staff share one form engine; staff adds role selection, a resume and the background-check gate.",
    source:
      "09-09 call said participants only for now; the merged BRD makes volunteer applications and Sterling checks core to the same domain.",
    status: "open",
    surfaces: ["/my/apply", "/operations/applications"],
  },
  {
    id: "health-retention",
    question: "Are health records deleted at 365 days, or retained for audit?",
    assumption: "Shown as expiring at 365 days with a reminder at 330. Nothing is deleted.",
    source: "Merged BRD, section 11 — listed as an open question needing an explicit answer.",
    status: "open",
    surfaces: ["/my/health"],
  },
  {
    id: "cross-camp-visibility",
    question: "May a camp see that an applicant also applied elsewhere?",
    assumption:
      "Deconfliction is visible to national and senior roles only; a camp lead sees their own camp.",
    source:
      "Merged BRD, section 11 — open. IUSA's permission grid implied cross-camp visibility; Luma 1.0 has none.",
    status: "open",
    surfaces: ["/operations/applications", "/operations/people"],
  },
  {
    id: "interview-scope",
    question: "Is interview scheduling in the applications MVP, or deferred?",
    assumption:
      "Included, read-mostly: scheduling and notes exist, with notes purged at cycle end.",
    source: "Merged BRD, section 11 — IUSA raised it as unresolved.",
    status: "open",
    surfaces: ["/operations/applications"],
  },
  {
    id: "minor-accounts",
    question: "At what age may a participant hold their own login?",
    assumption:
      "Minors have profiles, not logins. A teen who signs up separately is matched back to the household by email and phone.",
    source:
      "Person-Linking doc defers teen self-accounts; the 09-09 call assumed 16-year-olds would sign up themselves. Unreconciled.",
    status: "open",
    surfaces: ["/signup", "/my/household"],
  },
];

const BY_ID = new Map(OPEN_DECISIONS.map((decision) => [decision.id, decision]));

export function getDecision(id: string): OpenDecision | null {
  return BY_ID.get(id) ?? null;
}

/** Decisions bearing on a route, longest prefix first so pages beat sections. */
export function decisionsForRoute(pathname: string): readonly OpenDecision[] {
  return OPEN_DECISIONS.filter((decision) =>
    decision.surfaces.some((surface) =>
      surface === "/" ? pathname === "/" : pathname.startsWith(surface),
    ),
  );
}

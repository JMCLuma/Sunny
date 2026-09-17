import type {
  HouseholdOverview,
  PortalDeadline,
  SubmissionSummary,
} from "@/features/operations/data";
import type { Profile } from "@/features/operations/domain";

/**
 * View-model helpers for the family portal.
 *
 * Pure functions, kept out of the components for the usual reason — they are
 * the only part of these screens worth testing, and a React test setup does
 * not exist here. But also because the dashboard's real job is *ordering*, and
 * ordering is exactly the kind of thing that quietly rots inside JSX.
 */

/**
 * How close a deadline is, in the four bands a parent actually reacts to.
 *
 * `daysUntilDue` is negative when overdue — the repository says so, and the
 * arithmetic is easy to get backwards, so the sign is interpreted once here
 * rather than in every component that shows a date.
 */
export type DeadlineUrgency = "overdue" | "today" | "soon" | "later";

/** A week, because that is the horizon a reminder email would use. */
const SOON_DAYS = 7;

export function deadlineUrgency(daysUntilDue: number): DeadlineUrgency {
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue === 0) return "today";
  return daysUntilDue <= SOON_DAYS ? "soon" : "later";
}

/** "Overdue by 3 days", "Due today", "Due in 12 days". */
export function formatDeadlineDistance(daysUntilDue: number): string {
  if (daysUntilDue === 0) return "Due today";
  const magnitude = Math.abs(daysUntilDue);
  const unit = magnitude === 1 ? "day" : "days";
  return daysUntilDue < 0 ? `Overdue by ${magnitude} ${unit}` : `Due in ${magnitude} ${unit}`;
}

/** Preferred name when there is one — this is how the family refers to them. */
export function profileDisplayName(profile: Profile): string {
  return profile.preferredName ?? `${profile.legalFirstName} ${profile.legalLastName}`;
}

export function profileInitials(profile: Profile): string {
  const first = profile.legalFirstName.trim().charAt(0);
  const last = profile.legalLastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
}

/** Where an action item sends someone. A union, so a route typo cannot ship. */
export type ActionTarget =
  | { readonly kind: "profile"; readonly profileId: string }
  | { readonly kind: "household" }
  | { readonly kind: "applications" }
  | { readonly kind: "none" };

export type ActionTone = "critical" | "attention" | "routine";

export interface ActionItem {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly meta: string;
  readonly tone: ActionTone;
  readonly target: ActionTarget;
}

const TONE_ORDER: Readonly<Record<ActionTone, number>> = {
  critical: 0,
  attention: 1,
  routine: 2,
};

/**
 * The one list at the top of the dashboard.
 *
 * A household's real question on signing in is "is there anything I have to do
 * right now?", and the honest answer spans four unrelated tables — checklist
 * deadlines, an offer waiting on a reply, a half-finished application, a
 * profile stuck in review. Showing those as four sections makes the parent do
 * the merge. So the merge happens here, once, and the sections below become
 * reference rather than triage.
 *
 * Everything with a date is ordered by that date; everything without one falls
 * to the end of its band. No clock is read — `daysUntilDue` arrives already
 * computed against the demo's fixed "now", so the same input always renders
 * the same markup on the server and in the browser.
 */
export function buildActionQueue(overview: HouseholdOverview): readonly ActionItem[] {
  const items: { item: ActionItem; order: number }[] = [];

  for (const deadline of overview.upcomingDeadlines) {
    const urgency = deadlineUrgency(deadline.daysUntilDue);
    if (urgency === "later") continue;
    items.push({
      item: {
        id: `deadline:${deadline.profileId}:${deadline.label}`,
        title: deadline.label,
        detail: `${deadline.profileName} · ${deadline.programName}`,
        meta: formatDeadlineDistance(deadline.daysUntilDue),
        tone: urgency === "overdue" ? "critical" : "attention",
        target: { kind: "profile", profileId: deadline.profileId },
      },
      order: deadline.daysUntilDue,
    });
  }

  for (const summary of overview.submissions) {
    if (summary.submission.status !== "draft") continue;
    items.push({
      item: {
        id: `draft:${summary.submission.id}`,
        title: "Finish this application",
        detail: `${summary.profileName} · ${summary.programName}`,
        meta: `${Math.round(summary.completion * 100)}% complete`,
        tone: "routine",
        target: { kind: "applications" },
      },
      order: 1 - summary.completion,
    });
  }

  // A profile held in review is the only item here the family cannot resolve
  // themselves, so it says who is looking at it rather than asking for action.
  for (const summary of overview.profiles) {
    if (summary.profile.personLinkStatus !== "pending_match") continue;
    items.push({
      item: {
        id: `match:${summary.profile.id}`,
        title: "A profile is waiting on a review",
        detail: `${profileDisplayName(summary.profile)} can still apply while this is open.`,
        meta: "With the JMC team",
        tone: "attention",
        target: { kind: "household" },
      },
      order: 0,
    });
  }

  for (const invitation of overview.invitations) {
    items.push({
      item: {
        id: `invitation:${invitation.id}`,
        title: "An invitation is still unaccepted",
        detail: `${invitation.email} has not signed in yet, so they can see nothing.`,
        meta: `Expires ${invitation.expiresAt}`,
        tone: "routine",
        target: { kind: "household" },
      },
      order: 0,
    });
  }

  return items
    .sort((a, b) => TONE_ORDER[a.item.tone] - TONE_ORDER[b.item.tone] || a.order - b.order)
    .map((entry) => entry.item);
}

/** Deadlines past the "soon" horizon, for the calendar further down the page. */
export function laterDeadlines(deadlines: readonly PortalDeadline[]): readonly PortalDeadline[] {
  return deadlines.filter((deadline) => deadlineUrgency(deadline.daysUntilDue) === "later");
}

/**
 * Applications the family is still waiting on, separated from the settled
 * ones. Withdrawn and rejected applications stay visible but stop nagging.
 */
export function partitionSubmissions(submissions: readonly SubmissionSummary[]): {
  readonly inFlight: readonly SubmissionSummary[];
  readonly settled: readonly SubmissionSummary[];
} {
  const settledStatuses = new Set(["withdrawn", "rejected", "onboarded"]);
  return {
    inFlight: submissions.filter((entry) => !settledStatuses.has(entry.submission.status)),
    settled: submissions.filter((entry) => settledStatuses.has(entry.submission.status)),
  };
}

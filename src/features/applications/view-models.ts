import {
  ACTIONABLE_APPLICATION_STATUSES,
  type ApplicationStatus,
  type EligibilityReason,
  type IsoDate,
} from "@/features/operations/domain";
import type { EligibleInstanceRow, SubmissionSummary } from "@/features/operations/data";

/**
 * View models for the applicant's own screens.
 *
 * Operations and My Luma look at the same rows and need different words for
 * them. `under_review` is a queue state to a reviewer and "we have it, nothing
 * for you to do" to a family; `accepted` is an outcome to Operations and a
 * deadline to the person who has to answer it. So the applicant's vocabulary
 * lives here rather than being borrowed from the Operations status badge.
 */

export interface StatusPresentation {
  readonly label: string;
  readonly tone: "neutral" | "progress" | "good" | "warning" | "closed";
  /** One line the applicant can act on, or be reassured by. */
  readonly summary: string;
}

const STATUS_PRESENTATION: Readonly<Record<ApplicationStatus, StatusPresentation>> = {
  draft: {
    label: "Not sent yet",
    tone: "warning",
    summary: "Saved where you left off. Finish it to send it.",
  },
  submitted: { label: "Sent", tone: "progress", summary: "We have it. Nothing to do for now." },
  under_review: {
    label: "Being read",
    tone: "progress",
    summary: "The camp team is reading applications.",
  },
  interview_scheduled: {
    label: "Interview booked",
    tone: "progress",
    summary: "Check your email for the time and link.",
  },
  interviewed: {
    label: "Interview done",
    tone: "progress",
    summary: "Nothing to do while the team decides.",
  },
  scored: { label: "Being read", tone: "progress", summary: "Scoring is under way." },
  recommended: { label: "Being read", tone: "progress", summary: "Waiting on a final decision." },
  accepted: {
    label: "Offer — needs your answer",
    tone: "good",
    summary: "You have a place. Confirm it before the date below.",
  },
  waitlisted: {
    label: "Waitlisted",
    tone: "warning",
    summary: "No place yet. We'll email you if one opens up.",
  },
  rejected: {
    label: "Not this time",
    tone: "closed",
    summary: "No place this year. You can apply again next cycle.",
  },
  confirmed: {
    label: "Place confirmed",
    tone: "good",
    summary: "You're coming. Your camp checklist takes it from here.",
  },
  withdrawn: { label: "Withdrawn", tone: "closed", summary: "You withdrew this application." },
  background_check_cleared: {
    label: "Check cleared",
    tone: "good",
    summary: "Your background check cleared. Onboarding can start.",
  },
  onboarded: { label: "Onboarded", tone: "good", summary: "You're all set for this camp." },
};

export function presentStatus(status: ApplicationStatus): StatusPresentation {
  return STATUS_PRESENTATION[status];
}

export function isActionable(status: ApplicationStatus): boolean {
  return ACTIONABLE_APPLICATION_STATUSES.includes(status);
}

/** Whole days from `referenceDate` to a date. Negative once it has passed. */
export function daysUntil(referenceDate: string, date: IsoDate): number {
  const from = new Date(referenceDate).getTime();
  const to = new Date(`${date}T00:00:00.000Z`).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.ceil((to - from) / 86_400_000);
}

/** The date this row is counting down to, if it is counting down to anything. */
export function actionDate(row: SubmissionSummary): IsoDate | null {
  if (row.submission.status === "accepted") return row.submission.confirmByDate;
  if (row.submission.status === "draft") return row.deadline;
  return null;
}

/**
 * Needs-you first, soonest first within that.
 *
 * `ACTIONABLE_APPLICATION_STATUSES` is the domain's own list, so a status that
 * later becomes the applicant's problem starts sorting to the top here without
 * this file being touched. Ties break on a stable key rather than on input
 * order, because the list is rendered on the server and again in the browser.
 */
export function sortApplications(rows: readonly SubmissionSummary[]): readonly SubmissionSummary[] {
  const FAR_FUTURE = "9999-12-31";
  return [...rows].sort((a, b) => {
    const actionDelta =
      Number(isActionable(b.submission.status)) - Number(isActionable(a.submission.status));
    if (actionDelta !== 0) return actionDelta;

    const dateDelta = (actionDate(a) ?? FAR_FUTURE).localeCompare(actionDate(b) ?? FAR_FUTURE);
    if (dateDelta !== 0) return dateDelta;

    return a.submission.id.localeCompare(b.submission.id);
  });
}

/**
 * The three things a camp can be for one applicant.
 *
 * `notEligible` is a group, not a filter. A camp that disappears without
 * saying why generates a support email; the reasons are carried on
 * `EligibilityResult` precisely so the screen can answer the question instead.
 */
export interface EligibleInstanceGroups {
  readonly open: readonly EligibleInstanceRow[];
  readonly needsDetail: readonly EligibleInstanceRow[];
  readonly notEligible: readonly EligibleInstanceRow[];
}

export function groupEligibleInstances(
  rows: readonly EligibleInstanceRow[],
): EligibleInstanceGroups {
  const sorted = [...rows].sort((a, b) => {
    const dateDelta = (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31");
    if (dateDelta !== 0) return dateDelta;
    return a.instance.name.localeCompare(b.instance.name);
  });

  return {
    open: sorted.filter((row) => row.result.verdict === "eligible"),
    needsDetail: sorted.filter((row) => row.result.verdict === "unknown"),
    notEligible: sorted.filter((row) => row.result.verdict === "not_eligible"),
  };
}

/** The rows a "start these applications" action may act on. */
export function selectableRows(
  rows: readonly EligibleInstanceRow[],
): readonly EligibleInstanceRow[] {
  return rows.filter(
    (row) =>
      row.result.verdict === "eligible" && row.formId !== null && row.existingSubmissionId === null,
  );
}

/** Reason text, de-duplicated: two rules failing the same way says it once. */
export function reasonLines(reasons: readonly EligibilityReason[]): readonly string[] {
  return [...new Set(reasons.map((reason) => reason.detail))];
}

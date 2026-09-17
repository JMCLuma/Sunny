import type { ApplicationQueueRow } from "@/features/operations/data";
import type {
  ApplicationAnswer,
  ApplicationForm,
  ApplicationQuestion,
  ApplicationSection,
  ApplicationStatus,
  CriterionScore,
  Id,
  Interview,
  InterviewStatus,
  IsoDate,
  IsoDateTime,
  ScoringRubric,
} from "@/features/operations/domain";
import type { SelectionSortKey, SortDirection } from "./application-filters";

/**
 * View models for Applications & selection.
 *
 * Everything here is a pure function over what the repository already returned:
 * no fetching, no dates read from the clock, no `Math.random`. Two reasons.
 * These screens render on the server and again in the browser, and anything
 * that differs between the two is a hydration error in front of leadership. And
 * the arithmetic that decides a cohort — how many places are left, which scores
 * a human has actually signed for — is the part most worth testing, which it
 * only is if it lives away from the components.
 */

// ---------------------------------------------------------------------------
// The cohort
// ---------------------------------------------------------------------------

/** Statuses that occupy a place: someone in one of these is counted against capacity. */
const PLACE_HOLDING: readonly ApplicationStatus[] = [
  "accepted",
  "confirmed",
  "background_check_cleared",
  "onboarded",
];

/** Statuses where the camp has said no, or the applicant has walked away. */
const CLOSED: readonly ApplicationStatus[] = ["rejected", "withdrawn"];

export interface CohortSummary {
  readonly total: number;
  readonly plannedCapacity: number;
  /** Accepted or further along — the places actually committed. */
  readonly placed: number;
  /** Accepted but not yet confirmed: the ones a missed deadline sends to the waitlist. */
  readonly awaitingConfirmation: number;
  readonly waitlisted: number;
  readonly closed: number;
  /** Still waiting on the camp. The number that makes the screen urgent. */
  readonly undecided: number;
  /** Places left, floored at zero — an over-subscribed cohort reads as full. */
  readonly remaining: number;
  /** 0–1 against planned capacity, for the fill bar. */
  readonly fill: number;
  readonly overCapacity: boolean;
}

export function summarizeCohort(
  rows: readonly ApplicationQueueRow[],
  plannedCapacity: number,
): CohortSummary {
  let placed = 0;
  let awaitingConfirmation = 0;
  let waitlisted = 0;
  let closed = 0;

  for (const row of rows) {
    const status = row.submission.status;
    if (PLACE_HOLDING.includes(status)) {
      placed += 1;
      if (status === "accepted") awaitingConfirmation += 1;
    } else if (status === "waitlisted") waitlisted += 1;
    else if (CLOSED.includes(status)) closed += 1;
  }

  const undecided = rows.length - placed - waitlisted - closed;

  return {
    total: rows.length,
    plannedCapacity,
    placed,
    awaitingConfirmation,
    waitlisted,
    closed,
    undecided,
    remaining: Math.max(plannedCapacity - placed, 0),
    fill: plannedCapacity > 0 ? Math.min(placed / plannedCapacity, 1) : 0,
    overCapacity: placed > plannedCapacity,
  };
}

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

/**
 * Sorts a queue for display.
 *
 * Unscored rows sort last whichever direction is asked for: "worst first" is a
 * real question about scores, and an application nobody has scored yet has no
 * answer to it — dropping it to the bottom keeps it visible without implying a
 * zero. Ties break on the applicant label and then the submission id, so the
 * order is stable across renders and identical on server and client.
 */
export function sortQueueRows(
  rows: readonly ApplicationQueueRow[],
  sort: SelectionSortKey,
  dir: SortDirection,
): readonly ApplicationQueueRow[] {
  const sign = dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    let comparison = 0;

    switch (sort) {
      case "score": {
        if (a.totalScore === null || b.totalScore === null) {
          if (a.totalScore === b.totalScore) comparison = 0;
          else return a.totalScore === null ? 1 : -1;
        } else comparison = a.totalScore - b.totalScore;
        break;
      }
      case "name":
        comparison = a.applicantLabel.localeCompare(b.applicantLabel, "en");
        break;
      case "status":
        comparison = a.submission.status.localeCompare(b.submission.status, "en");
        break;
      case "region":
        comparison = (a.regionName ?? "").localeCompare(b.regionName ?? "", "en");
        break;
    }

    if (comparison !== 0) return comparison * sign;
    return (
      a.applicantLabel.localeCompare(b.applicantLabel, "en") ||
      a.submission.id.localeCompare(b.submission.id, "en")
    );
  });
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * The weighted total, computed the same way the repository computes it.
 *
 * Duplicated deliberately: the scoring panel has to show a running total before
 * anything is submitted, and a number that moved when you pressed save would
 * make a reviewer distrust the whole instrument.
 */
export function weightedTotal(
  criterionScores: readonly CriterionScore[],
  rubric: ScoringRubric,
): number {
  return criterionScores.reduce((total, entry) => {
    const criterion = rubric.criteria.find((item) => item.id === entry.criterionId);
    return total + entry.points * (criterion?.weight ?? 1);
  }, 0);
}

/** The ceiling, so a total reads as "87 of 135" rather than as a bare number. */
export function maxWeightedTotal(rubric: ScoringRubric): number {
  return rubric.criteria.reduce(
    (total, criterion) => total + criterion.maxPoints * criterion.weight,
    0,
  );
}

export interface ScoreConfirmationState {
  /** Criteria an AI pass proposed that no human has confirmed yet. */
  readonly awaitingHuman: readonly Id[];
  readonly confirmed: number;
  readonly total: number;
  /** True when nothing is left waiting on a person. */
  readonly signedOff: boolean;
}

/**
 * Which criteria still carry a machine's opinion and nobody's signature.
 *
 * `aiSuggested` is the whole governance point of the review screen: the essay
 * criteria arrive pre-scored, and until a reviewer confirms or changes each
 * one, the score is not a human's. This is what the UI blocks submission on.
 */
export function confirmationState(
  criterionScores: readonly CriterionScore[],
): ScoreConfirmationState {
  const awaitingHuman = criterionScores
    .filter((entry) => entry.aiSuggested)
    .map((entry) => entry.criterionId);

  return {
    awaitingHuman,
    confirmed: criterionScores.length - awaitingHuman.length,
    total: criterionScores.length,
    signedOff: awaitingHuman.length === 0,
  };
}

/**
 * Starting points for the scoring panel.
 *
 * An existing score is the draft; without one every criterion starts empty and
 * unconfirmed, so an untouched rubric can never be submitted as if reviewed.
 */
export function draftCriterionScores(
  rubric: ScoringRubric,
  existing: readonly CriterionScore[] | undefined,
): readonly CriterionScore[] {
  return rubric.criteria.map((criterion) => {
    const previous = existing?.find((entry) => entry.criterionId === criterion.id);
    return (
      previous ?? {
        criterionId: criterion.id,
        points: 0,
        note: null,
        aiSuggested: false,
      }
    );
  });
}

/** Clamps a typed value into the criterion's range; a bad keystroke is not a score. */
export function clampPoints(value: number, maxPoints: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.round(value), maxPoints));
}

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

export interface InterviewSummary {
  readonly counts: Readonly<Record<InterviewStatus, number>>;
  readonly total: number;
  /** Interviews holding notes — the rows the retention rule actually bites on. */
  readonly withNotes: number;
  /** Earliest purge date across those notes, or `null` when none carry one. */
  readonly earliestPurge: IsoDate | null;
}

export function summarizeInterviews(interviews: readonly Interview[]): InterviewSummary {
  const counts: Record<InterviewStatus, number> = {
    unscheduled: 0,
    scheduled: 0,
    completed: 0,
    no_show: 0,
    cancelled: 0,
  };
  let withNotes = 0;
  let earliestPurge: IsoDate | null = null;

  for (const interview of interviews) {
    counts[interview.status] += 1;
    if (!interview.notes) continue;
    withNotes += 1;
    if (interview.notesPurgeAfter === null) continue;
    if (earliestPurge === null || interview.notesPurgeAfter < earliestPurge) {
      earliestPurge = interview.notesPurgeAfter;
    }
  }

  return { counts, total: interviews.length, withNotes, earliestPurge };
}

/**
 * Whole days from a reference instant to a date, negative once it has passed.
 *
 * The reference is always passed in rather than read from the clock, so the
 * same input renders the same number on the server and in the browser.
 */
export function daysUntil(date: IsoDate, reference: IsoDateTime): number {
  const from = new Date(reference).getTime();
  const to = new Date(`${date}T00:00:00.000Z`).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

// ---------------------------------------------------------------------------
// One application
// ---------------------------------------------------------------------------

export interface AnsweredQuestion {
  readonly question: ApplicationQuestion;
  readonly answer: ApplicationAnswer | null;
}

export interface AnsweredSection {
  readonly section: ApplicationSection;
  readonly questions: readonly AnsweredQuestion[];
  /** Set for `camp_specific`: whose questions these are. */
  readonly ownedByProgramId: Id | null;
}

/**
 * Answers laid out the way the form was, section by section.
 *
 * Sections come back even when unanswered, because "they skipped the camp
 * questions" is information a reviewer needs and an omitted section hides.
 */
export function answersBySection(
  form: ApplicationForm,
  answers: readonly ApplicationAnswer[],
): readonly AnsweredSection[] {
  return [...form.sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      section,
      ownedByProgramId: section.ownedByProgramId,
      questions: form.questions
        .filter((question) => question.sectionId === section.id)
        .sort((a, b) => a.order - b.order)
        .map((question) => ({
          question,
          answer: answers.find((entry) => entry.questionId === question.id) ?? null,
        })),
    }));
}

/** A readable rendering of any answer shape, including repeatable-group rows. */
export function formatAnswerValue(
  answer: ApplicationAnswer | null,
  question: ApplicationQuestion,
): string {
  if (answer === null || answer.value === null || answer.value === "") return "Not answered";

  const { value } = answer;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return labelForOption(question, value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "Not answered";
    if (typeof value[0] === "string") {
      return (value as readonly string[])
        .map((entry) => labelForOption(question, entry))
        .join(", ");
    }
    return `${value.length} entr${value.length === 1 ? "y" : "ies"}`;
  }
  return "Not answered";
}

/** Stored values are option codes; a reviewer should read the label. */
function labelForOption(question: ApplicationQuestion, value: string): string {
  return question.options?.find((option) => option.value === value)?.label ?? value;
}

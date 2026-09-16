import type { Id, IsoDate, IsoDateTime, Metadata } from "./common";
import type { EligibilityAudience } from "./eligibility";

/**
 * The universal application: one form engine, every camp, participant and staff.
 *
 * ## What the 09-09 call decided, and what it means here
 *
 * The draft reviewed on that call was five sections of mostly checkboxes,
 * ripped from Embark's paper form. The feedback was consistent and is built in
 * rather than bolted on:
 *
 * - **Two sections, not five.** Length is the adoption risk. A thirteen-year-old
 *   who opens a form that looks long waits until the deadline; one that looks
 *   short starts now.
 * - **Confirm, don't retype.** Anything already on the profile arrives
 *   pre-filled and is confirmed. `prefillFrom` on a question is what wires that.
 * - **Typeahead over long lists.** Eighty-five Jamatkhanas is not a dropdown.
 * - **Street address removed.** Nothing used it; the health form collects a
 *   full address later, where there is a reason to hold one.
 * - **School kept.** It is read for socioeconomic reach across camps, which is
 *   a stated equity goal — the test applied to every question was "are we
 *   doing something with this?".
 * - **Repeatables capped.** "Camps attended" is unbounded in the draft; one
 *   applicant entering five hundred rows is a support problem, not a feature.
 *
 * Camp-specific questions are a *section appended by the camp*, not a fork of
 * the form. That is what lets a camp change its essay prompts year over year
 * without anybody rebuilding the application.
 */

export type QuestionType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "multi_select"
  /** Long option lists — Jamatkhana, country, language. Never a bare dropdown. */
  | "typeahead"
  | "boolean"
  | "file_upload"
  /** A repeating group of sub-questions, e.g. prior camps attended. */
  | "repeatable_group";

/** A profile or account field a question pre-fills from, so it is confirmed not retyped. */
export type PrefillSource =
  | "profile.legalFirstName"
  | "profile.legalLastName"
  | "profile.preferredName"
  | "profile.dateOfBirth"
  | "profile.risingSecularGrade"
  | "profile.risingRecGrade"
  | "profile.schoolName"
  | "profile.schoolType"
  | "profile.languages"
  | "profile.needsTranslator"
  | "account.email"
  | "account.phone"
  | "account.city"
  | "account.state"
  | "account.postalCode"
  | "account.regionId"
  | "account.jamatkhana";

export interface QuestionOption {
  readonly value: string;
  readonly label: string;
  /** Groups a long typeahead list, e.g. Jamatkhanas by region. */
  readonly group?: string;
}

export interface ApplicationQuestion {
  readonly id: Id;
  readonly sectionId: Id;
  readonly type: QuestionType;
  readonly label: string;
  readonly helpText: string | null;
  readonly required: boolean;
  readonly order: number;
  readonly options?: readonly QuestionOption[];
  /** Pre-filled and shown for confirmation rather than asked cold. */
  readonly prefillFrom?: PrefillSource;
  /** Sub-questions for `repeatable_group`. */
  readonly subQuestions?: readonly ApplicationQuestion[];
  /** Hard cap on `repeatable_group` entries. Unbounded lists are a support problem. */
  readonly maxEntries?: number;
  readonly maxLength?: number;
  readonly acceptedFileTypes?: readonly string[];
  /** Shown only when another question holds one of these values. */
  readonly visibleWhen?: {
    readonly questionId: Id;
    readonly equalsAnyOf: readonly string[];
  };
}

/**
 * `camp_specific` sections are owned by the camp and appended after the shared
 * ones. Everything else is the universal part, identical across camps — which
 * is the whole point of a common application.
 */
export type SectionKind = "profile_confirmation" | "background" | "camp_specific";

export interface ApplicationSection {
  readonly id: Id;
  readonly formId: Id;
  readonly kind: SectionKind;
  readonly title: string;
  readonly description: string | null;
  readonly order: number;
  /** Set for `camp_specific`; the program whose team maintains it. */
  readonly ownedByProgramId: Id | null;
}

export type FormStatus = "draft" | "published" | "closed" | "archived";

export interface ApplicationForm {
  readonly id: Id;
  readonly programId: Id;
  readonly programInstanceId: Id;
  readonly audience: EligibilityAudience;
  readonly title: string;
  readonly status: FormStatus;
  readonly opensOn: IsoDate | null;
  readonly deadline: IsoDate | null;
  /** Bumped when questions change mid-collection, which prompts re-confirmation. */
  readonly version: number;
  readonly sections: readonly ApplicationSection[];
  readonly questions: readonly ApplicationQuestion[];
  readonly metadata?: Metadata;
}

/**
 * Application lifecycle (BRD section 5).
 *
 * Participants and staff share the path up to `accepted`. Staff then have to
 * clear a background check before `onboarded`, and that gate is not optional:
 * a camp requiring a check cannot onboard anyone who has not cleared one.
 */
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "interview_scheduled"
  | "interviewed"
  | "scored"
  | "recommended"
  | "accepted"
  | "waitlisted"
  | "rejected"
  | "confirmed"
  | "withdrawn"
  | "background_check_cleared"
  | "onboarded";

/** Statuses an applicant can still act on — used to sort "needs you" first. */
export const ACTIONABLE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "draft",
  "accepted",
  "waitlisted",
];

export interface ApplicationAnswer {
  readonly questionId: Id;
  /** Scalar, multi-select list, or repeatable-group rows. */
  readonly value: string | number | boolean | readonly string[] | readonly AnswerRow[] | null;
  readonly fileName?: string;
}

/** One row of a `repeatable_group` answer. */
export interface AnswerRow {
  readonly [subQuestionId: string]: string | number | boolean | null;
}

export interface ApplicationSubmission {
  readonly id: Id;
  readonly formId: Id;
  readonly programId: Id;
  readonly programInstanceId: Id;
  readonly audience: EligibilityAudience;
  readonly accountId: Id;
  /** The household member this application is for. */
  readonly profileId: Id;
  readonly personId: Id | null;
  readonly status: ApplicationStatus;
  /** Form version answered against; a bump means answers need re-confirming. */
  readonly formVersion: number;
  readonly answers: readonly ApplicationAnswer[];
  /** Sections the applicant has completed — drives the progress bar. */
  readonly completedSectionIds: readonly Id[];
  readonly startedAt: IsoDateTime;
  readonly lastSavedAt: IsoDateTime;
  readonly submittedAt: IsoDateTime | null;
  /** Set on acceptance. A missed deadline auto-moves the application to waitlisted. */
  readonly confirmByDate: IsoDate | null;
  /** For staff applications where the camp requires a check. */
  readonly backgroundCheckRequired: boolean;
  readonly backgroundCheckStatus: BackgroundCheckStatus | null;
  readonly metadata?: Metadata;
}

/**
 * Sterling check state.
 *
 * Deliberately a status and nothing else — no findings, no report, no
 * narrative. Staffing decisions need to know whether someone cleared; almost
 * nobody needs to know what the report said, and the domain should not make it
 * possible to leak by accident.
 */
export type BackgroundCheckStatus =
  "not_started" | "invited" | "in_progress" | "cleared" | "consider" | "expired";

/**
 * A camp's scoring rubric.
 *
 * Camp-configurable by design. The BRD flags treating prioritization as one
 * generic scorer as a high risk, because Al-Ummah's demographic points and
 * Mosaic's PSW algorithm are genuinely different instruments. A rubric belongs
 * to an instance and is versioned, so a decision can always be re-read against
 * the rubric that actually produced it.
 */
export interface ScoringRubric {
  readonly id: Id;
  readonly programId: Id;
  readonly programInstanceId: Id;
  readonly name: string;
  readonly version: number;
  readonly criteria: readonly RubricCriterion[];
  readonly status: "draft" | "active" | "retired";
}

export type RubricCriterionKind = "demographic" | "essay" | "interview" | "experience";

export interface RubricCriterion {
  readonly id: Id;
  readonly rubricId: Id;
  readonly kind: RubricCriterionKind;
  readonly label: string;
  readonly description: string | null;
  readonly maxPoints: number;
  /** Relative weight within the rubric. */
  readonly weight: number;
  /** Set when points derive from an answer rather than a reviewer's judgement. */
  readonly sourceQuestionId: Id | null;
}

export interface CriterionScore {
  readonly criterionId: Id;
  readonly points: number;
  readonly note: string | null;
  /** True when an AI pass proposed this and a human has not yet confirmed it. */
  readonly aiSuggested: boolean;
}

export interface ApplicationScore {
  readonly id: Id;
  readonly submissionId: Id;
  readonly rubricId: Id;
  readonly rubricVersion: number;
  readonly reviewerPersonId: Id;
  /** Blind review: the reviewer saw answers without applicant identity. */
  readonly blind: boolean;
  readonly criterionScores: readonly CriterionScore[];
  readonly totalPoints: number;
  readonly submittedAt: IsoDateTime | null;
}

export type InterviewStatus = "unscheduled" | "scheduled" | "completed" | "no_show" | "cancelled";

export interface Interview {
  readonly id: Id;
  readonly submissionId: Id;
  readonly interviewerPersonId: Id | null;
  readonly status: InterviewStatus;
  readonly scheduledFor: IsoDateTime | null;
  readonly meetingUrl: string | null;
  /**
   * Notes are purged at cycle end per IUSA's requirement, so this carries the
   * date they go rather than leaving retention to whoever remembers.
   */
  readonly notes: string | null;
  readonly notesPurgeAfter: IsoDate | null;
}

export type DecisionOutcome = "accept" | "waitlist" | "reject" | "ineligible";

export interface SelectionDecision {
  readonly id: Id;
  readonly submissionId: Id;
  readonly outcome: DecisionOutcome;
  readonly decidedByPersonId: Id;
  readonly decidedAt: IsoDateTime;
  /** Which rubric version produced the score behind this decision. */
  readonly rubricVersion: number | null;
  readonly emailTemplateId: Id | null;
  readonly releasedAt: IsoDateTime | null;
  readonly note: string | null;
}

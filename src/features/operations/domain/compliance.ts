import type { ApprovalState, Id, IsoDate, IsoDateTime, Metadata, RecordStatus } from "./common";
import type { ProgramRole } from "./people";

/**
 * A rule the organization can require of a person — training, an agreement, a
 * certification, a screening. The definition says *what* is required and *who*
 * it applies to; it holds no personal data.
 */
export interface RequirementDefinition {
  readonly id: Id;
  readonly name: string;
  readonly category: RequirementCategory;
  readonly summary: string;
  /** How long a completion stays valid. `null` means it never expires. */
  readonly validForDays: number | null;
  readonly status: RecordStatus;
  /** Applicability rules, evaluated against a person's assignments. */
  readonly appliesTo: RequirementApplicability;
  readonly metadata?: Metadata;
}

export type RequirementCategory =
  "training" | "agreement" | "certification" | "screening" | "documentation";

/**
 * Applicability is assignment-driven: a requirement applies to a person when
 * any of their assignments matches every constraint listed here. An empty or
 * omitted constraint means "no restriction on this dimension".
 */
export interface RequirementApplicability {
  readonly roles?: readonly ProgramRole[];
  readonly programIds?: readonly Id[];
  readonly organizationIds?: readonly Id[];
  /** Minimum age band label, e.g. `adult`. Kept coarse on purpose. */
  readonly audience?: "youth" | "adult" | "all";
}

/**
 * A person's standing against one requirement.
 *
 * Completion belongs to the person, not to an assignment, so a volunteer who
 * moves between programs does not re-complete the same training. Only status
 * and dates live here — evidence (certificates, screening results) is held in
 * a restricted store and referenced by ID in a later phase.
 */
export interface RequirementAssignment {
  readonly id: Id;
  readonly requirementId: Id;
  readonly personId: Id;
  /** The assignment that made this requirement applicable, for auditability. */
  readonly triggeredByAssignmentId: Id | null;
  readonly status: RequirementStatus;
  readonly dueDate: IsoDate | null;
  readonly completedAt: IsoDateTime | null;
  readonly expiresAt: IsoDate | null;
  /** Review state when a requirement needs a human to accept the evidence. */
  readonly reviewState: ApprovalState;
}

export type RequirementStatus =
  "not_started" | "in_progress" | "submitted" | "complete" | "expiring_soon" | "expired" | "waived";

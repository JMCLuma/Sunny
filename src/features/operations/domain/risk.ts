import type { Id, IsoDateTime, Metadata } from "./common";

/**
 * A safety or risk event record — the *index* only.
 *
 * Narrative details, names of those involved, medical information and
 * investigation notes are deliberately excluded from this shared type. Phase 1
 * models severity, ownership and lifecycle so queues and reporting can be
 * built; the confidential body of an incident will live in a restricted store
 * reachable only through a dedicated, policy-guarded interface.
 */
export interface Incident {
  readonly id: Id;
  /** Short, non-identifying label, e.g. "Weather closure — site evacuation". */
  readonly reference: string;
  readonly category: IncidentCategory;
  readonly severity: IncidentSeverity;
  readonly organizationId: Id;
  readonly programId: Id | null;
  readonly programInstanceId: Id | null;
  readonly occurredAt: IsoDateTime;
  readonly reportedAt: IsoDateTime;
  readonly status: IncidentStatus;
  /** Person accountable for follow-up, not the people involved. */
  readonly ownerPersonId: Id | null;
  readonly metadata?: Metadata;
}

export type IncidentCategory =
  "safety" | "safeguarding" | "property" | "weather" | "transport" | "other";

export type IncidentSeverity = "low" | "moderate" | "high" | "critical";

export type IncidentStatus = "reported" | "under_review" | "action_required" | "closed";

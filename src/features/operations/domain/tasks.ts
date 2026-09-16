import type { Id, IsoDate, IsoDateTime, Metadata, Priority } from "./common";

/**
 * A unit of follow-up work surfaced in an operations queue.
 *
 * Tasks are cross-module on purpose: a compliance expiry, an unapproved
 * invoice and an unsigned contract all become the same kind of "needs
 * attention" row, linked back to the record that produced it.
 */
export interface Task {
  readonly id: Id;
  readonly title: string;
  /** Which module the task belongs to, used for routing and filtering. */
  readonly module: TaskModule;
  readonly priority: Priority;
  readonly status: TaskStatus;
  readonly dueDate: IsoDate | null;
  /** Person responsible; `null` when the task is owned by a role queue. */
  readonly assignedToPersonId: Id | null;
  /** Role queue that owns the task when it is unassigned. */
  readonly assignedToRole: string | null;
  readonly organizationId: Id;
  readonly programId: Id | null;
  /** Record that generated the task, for deep-linking in a later phase. */
  readonly relatedRecord: TaskRelatedRecord | null;
  readonly createdAt: IsoDateTime;
  readonly metadata?: Metadata;
}

export type TaskModule =
  | "programs"
  | "finance"
  | "compliance"
  | "vendors"
  | "risk"
  | "documents"
  | "insights"
  | "marketing"
  | "admin";

export type TaskStatus = "open" | "in_progress" | "blocked" | "done" | "cancelled";

export interface TaskRelatedRecord {
  readonly type:
    | "program_instance"
    | "program_event"
    | "financial_record"
    | "requirement_assignment"
    | "document"
    | "incident"
    | "vendor_contract";
  readonly id: Id;
}

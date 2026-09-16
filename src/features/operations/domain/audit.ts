import type { Id, IsoDateTime, Metadata } from "./common";

/**
 * An append-only record of a consequential action.
 *
 * Written by the system, never edited. Stores *what* changed and *who* acted,
 * never the changed values themselves, so the audit trail can be readable by a
 * broader audience than the records it describes.
 */
export interface AuditEvent {
  readonly id: Id;
  readonly occurredAt: IsoDateTime;
  /** Person who acted; `null` for system-generated events. */
  readonly actorPersonId: Id | null;
  /** Display label captured at write time so history survives renames. */
  readonly actorLabel: string;
  readonly action: AuditAction;
  readonly resource: string;
  readonly resourceId: Id | null;
  readonly organizationId: Id | null;
  /** Short human-readable summary, free of confidential detail. */
  readonly summary: string;
  readonly metadata?: Metadata;
}

export type AuditAction =
  | "created"
  | "updated"
  | "status_changed"
  | "approved"
  | "rejected"
  | "assigned"
  | "viewed_restricted"
  | "exported";

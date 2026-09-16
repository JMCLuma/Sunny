import type { Id, IsoDate, IsoDateTime, Metadata } from "./common";

/**
 * The post-acceptance checklist.
 *
 * Once a family is accepted, everything still owed — waivers, health forms,
 * travel, payment, trainings, a background check — becomes one list with
 * deadlines, rather than six emails pointing at six places. Camp teams add
 * items themselves, which is why an item carries its own copy and icon instead
 * of the platform hard-coding a fixed set.
 *
 * Items are configured per program instance and per role, so a staff member
 * and a participant at the same camp see different lists without anyone
 * maintaining two checklists.
 */

export type ChecklistItemKind =
  | "health_form"
  | "waiver"
  | "travel"
  | "payment"
  | "training"
  | "background_check"
  | "document_upload"
  | "custom";

export type ChecklistItemStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "action_needed"
  | "complete"
  | "waived";

/** Where an item sends the family. Typed so a link is checked, not a raw string. */
export type ChecklistTarget =
  | { readonly kind: "health" }
  | { readonly kind: "waivers" }
  | { readonly kind: "travel" }
  | { readonly kind: "payment" }
  | { readonly kind: "external"; readonly url: string }
  | { readonly kind: "none" };

/** A camp's definition of one checklist item. */
export interface ChecklistItemDefinition {
  readonly id: Id;
  readonly programId: Id;
  readonly programInstanceId: Id;
  readonly kind: ChecklistItemKind;
  readonly title: string;
  readonly description: string | null;
  readonly icon: string;
  readonly order: number;
  readonly dueDate: IsoDate | null;
  readonly target: ChecklistTarget;
  /** Which assignment roles see this item. Empty means everyone. */
  readonly appliesToRoles: readonly string[];
  readonly required: boolean;
}

/** One family member's progress against one definition. */
export interface ChecklistProgress {
  readonly id: Id;
  readonly definitionId: Id;
  readonly profileId: Id;
  readonly programInstanceId: Id;
  readonly status: ChecklistItemStatus;
  /** Shown under the item, e.g. "Physician form received, awaiting review". */
  readonly subStatus: string | null;
  readonly updatedAt: IsoDateTime;
  readonly completedAt: IsoDateTime | null;
  readonly metadata?: Metadata;
}

/** A definition joined to one profile's progress — what the portal renders. */
export interface ChecklistEntry {
  readonly definition: ChecklistItemDefinition;
  readonly progress: ChecklistProgress | null;
  readonly status: ChecklistItemStatus;
  readonly dueDate: IsoDate | null;
  /** Negative when overdue. Null when the item has no deadline. */
  readonly daysUntilDue: number | null;
}

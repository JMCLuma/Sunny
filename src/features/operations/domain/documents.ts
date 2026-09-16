import type { ApprovalState, Id, IsoDate, IsoDateTime, Metadata } from "./common";

/**
 * Metadata about a document the organization holds. Phase 1 stores no file
 * contents and no storage URLs — uploads are explicitly out of scope. The
 * record exists so retention, ownership and review state can be modelled now.
 */
export interface DocumentRecord {
  readonly id: Id;
  readonly title: string;
  readonly documentType: DocumentType;
  /** What the document is about, as an entity reference. */
  readonly subjectType: DocumentSubjectType;
  readonly subjectId: Id | null;
  readonly organizationId: Id;
  readonly sensitivity: DocumentSensitivity;
  readonly version: number;
  readonly effectiveDate: IsoDate | null;
  readonly reviewDueDate: IsoDate | null;
  readonly approvalState: ApprovalState;
  readonly updatedAt: IsoDateTime;
  readonly metadata?: Metadata;
}

export type DocumentType =
  "policy" | "procedure" | "agreement" | "contract" | "report" | "template";

export type DocumentSubjectType = "organization" | "program" | "program_instance" | "vendor";

/**
 * Drives who may see a document once Row Level Security is in place.
 * `restricted` documents are never surfaced in shared views such as the
 * Operations overview.
 */
export type DocumentSensitivity = "public" | "internal" | "restricted";

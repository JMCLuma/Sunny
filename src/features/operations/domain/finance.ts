import type {
  ApprovalState,
  CurrencyCode,
  Id,
  IsoDate,
  IsoDateTime,
  Metadata,
  MinorUnits,
} from "./common";

/**
 * One money movement or commitment, of any kind.
 *
 * Deliberately a single record type with a `recordType` discriminator rather
 * than a table per category. Registration fees, grants, donations, stipends,
 * reimbursements and vendor invoices differ in *classification*, not in shape:
 * they all have an amount, a direction, a counterparty, a program context and
 * a review state. New categories are a new `recordType` value plus a category
 * code, not a new interface and migration.
 *
 * Bank details, card data and payment-processor identifiers are intentionally
 * absent and belong in a restricted store behind its own policies.
 */
export interface FinancialRecord {
  readonly id: Id;
  readonly recordType: FinancialRecordType;
  /** `inflow` increases funds available, `outflow` decreases them. */
  readonly direction: "inflow" | "outflow";
  /** Chart-of-accounts style code, e.g. `revenue.registration`. */
  readonly categoryCode: string;
  readonly description: string;
  readonly amountMinor: MinorUnits;
  readonly currency: CurrencyCode;
  readonly organizationId: Id;
  readonly programId: Id | null;
  readonly programInstanceId: Id | null;
  /** Fiscal year the record is booked against. */
  readonly fiscalYear: number;
  readonly occurredOn: IsoDate;
  readonly status: FinancialRecordStatus;
  /** Current position in the review chain; details live in Approval records. */
  readonly approvalState: ApprovalState;
  readonly metadata?: Metadata;
}

export type FinancialRecordType =
  "budget_line" | "revenue" | "expense" | "reimbursement_request" | "vendor_invoice" | "transfer";

export type FinancialRecordStatus = "draft" | "submitted" | "in_review" | "posted" | "void";

/**
 * A decision step on any reviewable record (finance, compliance, documents,
 * vendors). Generic by design so that queues can be assembled across modules.
 */
export interface Approval {
  readonly id: Id;
  /** What is being approved. */
  readonly subjectType: ApprovalSubjectType;
  readonly subjectId: Id;
  /** 1-based position in a multi-step chain. */
  readonly step: number;
  /** Role expected to act, rather than a named individual. */
  readonly requiredRole: string;
  readonly state: ApprovalState;
  readonly requestedAt: IsoDateTime;
  readonly decidedAt: IsoDateTime | null;
  /** Person who decided; `null` while pending. */
  readonly decidedByPersonId: Id | null;
  /** Short, non-confidential decision note. */
  readonly note: string | null;
}

export type ApprovalSubjectType =
  | "financial_record"
  | "document"
  | "requirement_assignment"
  | "vendor_contract"
  | "program_instance";

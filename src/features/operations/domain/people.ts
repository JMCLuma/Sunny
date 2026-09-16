import type { Id, IsoDate, IsoDateTime, Metadata } from "./common";

/**
 * A human known to the organization.
 *
 * A Person is deliberately independent of any login: volunteers, participants
 * and staff exist whether or not they ever sign in, and one person must never
 * be duplicated because they gained (or lost) an account. The link to a login
 * is a separate, optional UserAccountReference.
 *
 * This record is the *non-confidential* index card only. Health information,
 * background-check results, emergency contacts and identity documents are
 * deliberately absent and will live in access-controlled stores with their own
 * Row Level Security policies.
 */
export interface Person {
  readonly id: Id;
  readonly displayName: string;
  /** Primary organization affiliation used for `region` scope resolution. */
  readonly organizationId: Id;
  readonly status: PersonStatus;
  /** Broad category; a person may act in several capacities over time. */
  readonly personType: PersonType;
  readonly createdAt: IsoDateTime;
  readonly metadata?: Metadata;
}

export type PersonStatus = "prospective" | "active" | "inactive" | "alumni";

export type PersonType = "participant" | "volunteer" | "staff" | "vendor_contact" | "guardian";

/**
 * The bridge between a Person and an authentication identity.
 *
 * Phase 1 stores only a provider-neutral reference. When Supabase Auth is
 * introduced, `authUserId` becomes the `auth.users.id` UUID and this table
 * becomes the join that Row Level Security policies read to answer
 * "which person is this request acting as?".
 */
export interface UserAccountReference {
  readonly id: Id;
  readonly personId: Id;
  /** Opaque auth-provider subject. `null` while a person has no login. */
  readonly authUserId: Id | null;
  readonly provider: "mock" | "supabase";
  readonly accountStatus: "none" | "invited" | "active" | "suspended";
  readonly lastSignInAt: IsoDateTime | null;
}

/**
 * A person's role on a specific program instance for a date range.
 *
 * A person may hold many assignments at once (different programs, different
 * regions, different years). Requirement applicability is derived from these
 * assignments, while requirement *completion* belongs to the person.
 */
export interface ProgramAssignment {
  readonly id: Id;
  readonly personId: Id;
  readonly programId: Id;
  readonly programInstanceId: Id;
  readonly organizationId: Id;
  readonly role: ProgramRole;
  readonly startDate: IsoDate;
  /** `null` while the assignment is open-ended. */
  readonly endDate: IsoDate | null;
  readonly status: ProgramAssignmentStatus;
  readonly metadata?: Metadata;
}

export type ProgramRole =
  "participant" | "volunteer" | "team_lead" | "program_manager" | "regional_lead" | "observer";

export type ProgramAssignmentStatus = "proposed" | "confirmed" | "withdrawn" | "completed";

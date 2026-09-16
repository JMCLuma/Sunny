import type { Id, IsoDate, IsoDateTime, Metadata } from "./common";
import type { RegionId } from "./region";

/**
 * A standing program (Mosaic, Embark, Roots...). A Program is the ongoing
 * identity of an offering — its name, audience and purpose. It is never
 * recreated for a new year, region or session: those are ProgramInstances.
 */
export interface Program {
  readonly id: Id;
  readonly name: string;
  /** URL/report-safe short identifier, e.g. `mosaic`. */
  readonly slug: string;
  readonly summary: string;
  /** Organization that owns the program nationally. */
  readonly organizationId: Id;
  readonly audience: ProgramAudience;
  readonly status: ProgramStatus;
  readonly metadata?: Metadata;
}

export type ProgramAudience = "youth" | "young_adult" | "adult" | "family" | "staff";

/**
 * Program lifecycle. `inactive` is a program not running this cycle but
 * expected back; `archived` is retired. Neither deletes history.
 */
export type ProgramStatus = "active" | "inactive" | "archived";

/**
 * One delivery of a Program — a year, session, region, location, cohort, or a
 * combination of those. Instances are what people are assigned to, what
 * requirements key off, and what finance and compliance roll up to.
 *
 * Fees, expenses, contract terms, confidential records and participant details
 * deliberately do not live here; they belong to the modules that own them.
 */
export interface ProgramInstance {
  readonly id: Id;
  readonly programId: Id;
  /** Human label for this delivery, e.g. "Mosaic Summer 2026 — Southwest". */
  readonly name: string;
  /** Operating cycle the instance belongs to, e.g. 2026. */
  readonly cycleYear: number;
  /**
   * Region delivering this instance — an organization id of kind `region`, the
   * same identifier the authorization service uses for its `region` scope.
   */
  readonly organizationId: RegionId;
  /** What shape this delivery takes, when the distinction is useful. */
  readonly instanceType: ProgramInstanceType;
  /** Non-confidential venue or area label. `null` while undecided. */
  readonly locationName: string | null;
  /** `null` while dates are undecided — do not invent a placeholder date. */
  readonly startDate: IsoDate | null;
  readonly endDate: IsoDate | null;
  /** False while the dates above are a working assumption, not a commitment. */
  readonly datesConfirmed: boolean;
  readonly status: ProgramInstanceStatus;
  /** Participant age band, where the program has one. */
  readonly ageRange: AgeRange | null;
  /** Planned participant count. Actuals live in later-phase enrollment records. */
  readonly plannedCapacity: number;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly metadata?: Metadata;
}

/** Inclusive age band. Kept coarse — never a date of birth. */
export interface AgeRange {
  readonly minAge: number;
  readonly maxAge: number;
}

export type ProgramInstanceType = "session" | "cohort" | "regional_delivery" | "annual_cycle";

export type ProgramInstanceStatus =
  "planning" | "applications_open" | "confirmed" | "in_progress" | "completed" | "cancelled";

/**
 * A dated operational gathering: training, orientation, a staff camp, a
 * summit, a planning meeting.
 *
 * An event belongs to exactly one program and links to any number of that
 * program's instances. One training serving three regional instances is one
 * event with three links — never three copies — so the schedule shows what
 * actually happens once.
 *
 * Attendance records, participant lists, notes and attachments are out of
 * scope and must not be added here.
 */
export interface ProgramEvent {
  readonly id: Id;
  readonly title: string;
  readonly eventType: ProgramEventType;
  readonly programId: Id;
  /** Instances this event supports. Empty when it serves the program at large. */
  readonly programInstanceIds: readonly Id[];
  readonly organizationId: Id;
  /** Who the event is for, e.g. "Regional staff". Never a list of people. */
  readonly audienceLabel: string;
  readonly deliveryMode: EventDeliveryMode;
  /** Venue or area label; `null` for virtual delivery. */
  readonly locationName: string | null;
  readonly startsAt: IsoDateTime;
  readonly endsAt: IsoDateTime;
  /** IANA zone when local time matters to the reader, e.g. `America/Chicago`. */
  readonly timeZone: string | null;
  readonly status: ProgramEventStatus;
  /** Whether attendance is expected of assigned staff/volunteers. */
  readonly attendanceRequired: boolean;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly metadata?: Metadata;
}

export type EventDeliveryMode = "in_person" | "virtual" | "hybrid";

export type ProgramEventType =
  | "training"
  | "orientation"
  | "meeting"
  | "staff_camp"
  | "summit"
  | "site_visit"
  | "debrief"
  | "other";

export type ProgramEventStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

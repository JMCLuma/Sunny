import type {
  AuditEvent,
  Id,
  IntegrationConnection,
  IsoDate,
  IsoDateTime,
  MinorUnits,
  Program,
  ProgramEvent,
  ProgramEventType,
  ProgramInstance,
  ProgramInstanceStatus,
  ReadinessArea,
  ReadinessSignal,
  ReadinessStatus,
  Region,
  RegionId,
  RequirementCategory,
  Task,
} from "../domain";

/**
 * The data contract for the Operations module.
 *
 * Every screen reads through this interface. Page components never import seed
 * arrays, never call `fetch`, and never know whether the answer came from a
 * mock, from Supabase, or from an API — which is the point: Phase 2 replaces
 * the implementation, not the pages.
 *
 * All methods are async even though the Phase 1 implementation resolves
 * immediately, so that adding real I/O later changes no call sites.
 */

/** Filters accepted by every list method. Omitted fields mean "no filter". */
export interface OperationsQuery {
  /** "Now" for upcoming/overdue calculations. Defaults to the current time. */
  readonly referenceDate?: IsoDateTime;
  readonly organizationId?: Id;
  readonly programId?: Id;
  readonly limit?: number;
}

/** One program with the counts that make the portfolio readable at a glance. */
export interface ProgramPortfolioRow {
  readonly program: Program;
  readonly activeInstances: number;
  readonly upcomingInstances: number;
  /** Distinct people holding a confirmed assignment on any instance. */
  readonly assignedPeople: number;
}

export interface UpcomingInstanceRow {
  readonly instance: ProgramInstance;
  readonly programName: string;
}

export interface UpcomingEventRow {
  readonly event: ProgramEvent;
  /** `null` for cross-program events. */
  readonly programName: string | null;
}

/** Readiness for one requirement, aggregated across people. Never per-person. */
export interface ComplianceReadinessRow {
  readonly requirementId: Id;
  readonly requirementName: string;
  readonly category: RequirementCategory;
  readonly assigned: number;
  readonly complete: number;
  readonly outstanding: number;
  readonly expiringSoon: number;
}

/** One stage of the finance review pipeline. */
export interface FinanceWorkflowRow {
  readonly stage: string;
  readonly count: number;
  readonly totalMinor: MinorUnits;
}

/**
 * Everything the Operations overview renders, assembled by the repository so
 * the page does no joining or aggregation of its own.
 */
export interface OperationsOverview {
  readonly generatedAt: IsoDateTime;
  readonly portfolio: readonly ProgramPortfolioRow[];
  readonly upcomingInstances: readonly UpcomingInstanceRow[];
  readonly upcomingEvents: readonly UpcomingEventRow[];
  readonly attention: readonly Task[];
  readonly complianceReadiness: readonly ComplianceReadinessRow[];
  readonly financeWorkflow: readonly FinanceWorkflowRow[];
  readonly recentActivity: readonly AuditEvent[];
  readonly integrations: readonly IntegrationConnection[];
}

export interface OperationsRepository extends ProgramsRepository {
  getOverview(query?: OperationsQuery): Promise<OperationsOverview>;
  listPrograms(query?: OperationsQuery): Promise<readonly Program[]>;
  listProgramInstances(query?: OperationsQuery): Promise<readonly ProgramInstance[]>;
  listUpcomingProgramEvents(query?: OperationsQuery): Promise<readonly UpcomingEventRow[]>;
  listTasksRequiringAttention(query?: OperationsQuery): Promise<readonly Task[]>;
  listRecentAuditEvents(query?: OperationsQuery): Promise<readonly AuditEvent[]>;
  listIntegrationConnections(query?: OperationsQuery): Promise<readonly IntegrationConnection[]>;
}

// ---------------------------------------------------------------------------
// Programs module (Phase 2)
//
// Filters are explicit types rather than a widening bag of optional arguments,
// so a Supabase-backed implementation can translate each one to a predicate
// and the UI cannot ask a question the contract has not agreed to answer.
// ---------------------------------------------------------------------------

/** Shared by every Programs filter: what "now" means, so results are testable. */
interface ReferenceDated {
  readonly referenceDate?: IsoDateTime;
}

export interface ProgramFilters extends ReferenceDated {
  /** Case-insensitive match on a program name/slug/summary or an instance name. */
  readonly search?: string;
  readonly cycleYear?: number;
  readonly regionId?: RegionId;
  /** Keeps only instances at this lifecycle status, and programs that have one. */
  readonly status?: ProgramInstanceStatus;
}

export interface ProgramInstanceFilters extends ReferenceDated {
  readonly programId?: Id;
  readonly cycleYear?: number;
  readonly regionId?: RegionId;
  readonly status?: ProgramInstanceStatus;
  readonly search?: string;
}

export interface ProgramEventFilters extends ReferenceDated {
  readonly programId?: Id;
  readonly cycleYear?: number;
  readonly eventType?: ProgramEventType;
  /** Matches events whose linked instances include one in this region. */
  readonly regionId?: RegionId;
  /** Inclusive ISO date bounds on the event start. */
  readonly from?: IsoDate;
  readonly to?: IsoDate;
  readonly search?: string;
  /** Default false: the schedule looks forward unless asked otherwise. */
  readonly includePast?: boolean;
}

/** Readiness for one instance, counted rather than itemised for list views. */
export interface ReadinessSummary {
  readonly signals: readonly ReadinessSignal[];
  /** Areas that are neither ready nor deliberately out of scope. */
  readonly tracked: number;
  readonly ready: number;
  readonly needsAttention: number;
}

export interface ProgramInstanceSummary {
  readonly instance: ProgramInstance;
  readonly programName: string;
  /** `null` when the instance references a region that no longer exists. */
  readonly region: Region | null;
  readonly eventCount: number;
  readonly readiness: ReadinessSummary;
}

export interface ProgramSummary {
  readonly program: Program;
  /** Instances matching the active filters, in deterministic order. */
  readonly instances: readonly ProgramInstanceSummary[];
  readonly instanceCount: number;
  readonly activeInstances: number;
  readonly upcomingInstances: number;
  readonly regions: readonly Region[];
  readonly cycleYears: readonly number[];
}

export interface ProgramEventRow {
  readonly event: ProgramEvent;
  readonly programName: string;
  /** The instances this one event serves — never a duplicated event per link. */
  readonly instances: readonly LinkedInstanceRef[];
  /** Regions derived from the linked instances, de-duplicated. */
  readonly regions: readonly Region[];
}

export interface LinkedInstanceRef {
  readonly id: Id;
  readonly programId: Id;
  readonly name: string;
  readonly regionId: RegionId;
}

/** Readiness across every relevant instance of a program, by area. */
export interface ProgramReadinessRollupRow {
  readonly area: ReadinessArea;
  readonly counts: Readonly<Record<ReadinessStatus, number>>;
}

export interface ProgramDetail {
  readonly program: Program;
  /** Instances under way now. */
  readonly current: readonly ProgramInstanceSummary[];
  /** Instances not yet started, soonest first. */
  readonly upcoming: readonly ProgramInstanceSummary[];
  /** Finished or cancelled instances, most recent first. */
  readonly completed: readonly ProgramInstanceSummary[];
  readonly upcomingEvents: readonly ProgramEventRow[];
  readonly readiness: readonly ProgramReadinessRollupRow[];
}

export interface ProgramInstanceDetail {
  readonly program: Program;
  readonly instance: ProgramInstance;
  readonly region: Region | null;
  readonly events: readonly ProgramEventRow[];
  readonly readiness: readonly ReadinessSignal[];
}

/**
 * Programs reads. Added to `OperationsRepository` below rather than to a
 * parallel service, so there stays exactly one data contract to reimplement.
 */
export interface ProgramsRepository {
  /** Region catalogue — the region-kind organizations, projected for reading. */
  listRegions(): Promise<readonly Region[]>;
  /** Every cycle year present in the data, ascending. Powers the year filter. */
  listProgramCycleYears(): Promise<readonly number[]>;
  getProgram(programId: Id): Promise<Program | null>;
  listProgramSummaries(filters?: ProgramFilters): Promise<readonly ProgramSummary[]>;
  getProgramDetail(programId: Id, filters?: ReferenceDated): Promise<ProgramDetail | null>;
  listProgramInstanceSummaries(
    filters?: ProgramInstanceFilters,
  ): Promise<readonly ProgramInstanceSummary[]>;
  /**
   * Both ids are required and must agree: an instance that exists but belongs
   * to another program resolves to `null`, never to a rendered page.
   */
  getProgramInstance(programId: Id, instanceId: Id): Promise<ProgramInstance | null>;
  getProgramInstanceDetail(programId: Id, instanceId: Id): Promise<ProgramInstanceDetail | null>;
  listProgramEvents(filters?: ProgramEventFilters): Promise<readonly ProgramEventRow[]>;
}

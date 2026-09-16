/**
 * Phase 1 implementation of the Operations data contract.
 *
 * Reads and joins the seed arrays in `./mock-data`. No I/O, no timers — every
 * method is still `async` so a later Supabase-backed repository can replace
 * this module without changing any call site.
 */
import type {
  ApprovalState,
  AuditEvent,
  Id,
  IntegrationConnection,
  IsoDateTime,
  Priority,
  Program,
  ProgramEvent,
  ProgramInstance,
  ReadinessSignal,
  Region,
  RegionId,
  Task,
  TaskStatus,
} from "../domain";
import type {
  ComplianceReadinessRow,
  FinanceWorkflowRow,
  OperationsOverview,
  OperationsQuery,
  OperationsRepository,
  ProgramDetail,
  ProgramEventFilters,
  ProgramEventRow,
  ProgramFilters,
  ProgramInstanceDetail,
  ProgramInstanceFilters,
  ProgramInstanceSummary,
  ProgramPortfolioRow,
  ProgramSummary,
  UpcomingEventRow,
  UpcomingInstanceRow,
} from "./repository";
import { createLuma2RepositorySlice } from "./mock-luma2-repository";
import {
  compareEvents,
  compareInstances,
  compareInstancesDescending,
  countInstances,
  dateOnly,
  isInFlightInstance,
  isUpcomingInstance,
  rollupReadiness,
  sortReadinessSignals,
  summarizeReadiness,
} from "./program-views";
import {
  auditEvents,
  financialRecords,
  integrationConnections,
  organizations,
  programAssignments,
  programEvents,
  programInstances,
  programs,
  readinessSignals,
  requirementAssignments,
  requirementDefinitions,
  tasks,
} from "./mock-data";

// ---------------------------------------------------------------------------
// Shared lookups and small predicates
// ---------------------------------------------------------------------------

const programsById = new Map<Id, Program>(programs.map((program) => [program.id, program]));

/** Task statuses that still require someone's attention. */
const ATTENTION_TASK_STATUSES = new Set<TaskStatus>(["open", "in_progress", "blocked"]);

/** Lower rank sorts first, i.e. more urgent. */
const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

/** Review-chain order used to present the finance workflow consistently. */
const STAGE_ORDER: readonly ApprovalState[] = [
  "not_submitted",
  "pending",
  "approved",
  "rejected",
  "withdrawn",
];

/** Sentinel that sorts after every real ISO date string, so nulls land last. */
const NO_DUE_DATE_SORT_VALUE = "9999-99-99";

function resolveReferenceDate(query?: OperationsQuery): IsoDateTime {
  return query?.referenceDate ?? new Date().toISOString();
}

function matchesOrganization(organizationId: Id | null, query?: OperationsQuery): boolean {
  return query?.organizationId === undefined || query.organizationId === organizationId;
}

function matchesProgram(programId: Id | null, query?: OperationsQuery): boolean {
  return query?.programId === undefined || query.programId === programId;
}

function applyLimit<T>(items: readonly T[], query?: OperationsQuery): readonly T[] {
  return query?.limit === undefined ? items.slice() : items.slice(0, query.limit);
}

function isTaskOverdue(task: Task, referenceDate: IsoDateTime): boolean {
  return task.dueDate !== null && dateOnly(task.dueDate) < dateOnly(referenceDate);
}

function taskDueDateSortValue(task: Task): string {
  return task.dueDate ?? NO_DUE_DATE_SORT_VALUE;
}

/** Overdue first, then urgent -> low, then soonest due date, nulls last. */
function compareForAttention(a: Task, b: Task, referenceDate: IsoDateTime): number {
  const overdueRank =
    Number(isTaskOverdue(b, referenceDate)) - Number(isTaskOverdue(a, referenceDate));
  if (overdueRank !== 0) return overdueRank;

  const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (priorityDiff !== 0) return priorityDiff;

  return taskDueDateSortValue(a).localeCompare(taskDueDateSortValue(b));
}

// ---------------------------------------------------------------------------
// Query-aware list builders, shared between the individual list methods and
// getOverview so the two never disagree.
// ---------------------------------------------------------------------------

function selectPrograms(query?: OperationsQuery): Program[] {
  return programs.filter(
    (program) =>
      matchesOrganization(program.organizationId, query) && matchesProgram(program.id, query),
  );
}

function selectProgramInstances(query?: OperationsQuery): ProgramInstance[] {
  return programInstances.filter(
    (instance) =>
      matchesOrganization(instance.organizationId, query) &&
      matchesProgram(instance.programId, query),
  );
}

function selectUpcomingEventRows(
  query: OperationsQuery | undefined,
  referenceDate: IsoDateTime,
): UpcomingEventRow[] {
  return programEvents
    .filter(
      (event) =>
        event.status !== "cancelled" &&
        event.startsAt >= referenceDate &&
        matchesOrganization(event.organizationId, query) &&
        matchesProgram(event.programId, query),
    )
    .sort(compareEvents)
    .map((event) => ({
      event,
      programName: programsById.get(event.programId)?.name ?? null,
    }));
}

function selectAttentionTasks(
  query: OperationsQuery | undefined,
  referenceDate: IsoDateTime,
): Task[] {
  return tasks
    .filter(
      (task) =>
        ATTENTION_TASK_STATUSES.has(task.status) &&
        matchesOrganization(task.organizationId, query) &&
        matchesProgram(task.programId, query),
    )
    .sort((a, b) => compareForAttention(a, b, referenceDate));
}

function selectRecentAuditEvents(query?: OperationsQuery): AuditEvent[] {
  // AuditEvent has no programId, so only the organization filter is meaningful here.
  return auditEvents
    .filter((event) => matchesOrganization(event.organizationId, query))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function selectIntegrationConnections(query?: OperationsQuery): IntegrationConnection[] {
  // Integrations are not program-scoped, so only the organization filter is meaningful here.
  return integrationConnections.filter((connection) =>
    matchesOrganization(connection.organizationId, query),
  );
}

// ---------------------------------------------------------------------------
// Overview assembly
// ---------------------------------------------------------------------------

function buildPortfolio(
  query: OperationsQuery | undefined,
  referenceDate: IsoDateTime,
): ProgramPortfolioRow[] {
  return selectPrograms(query)
    .filter((program) => program.status === "active")
    .map((program) => {
      // Honours the same organization filter as the program list, so a
      // region-scoped overview does not count another region's sessions.
      const instances = programInstances.filter(
        (instance) =>
          instance.programId === program.id && matchesOrganization(instance.organizationId, query),
      );
      const activeInstances = instances.filter(isInFlightInstance).length;
      const upcomingInstances = instances.filter((instance) =>
        isUpcomingInstance(instance, referenceDate),
      ).length;

      const assignedPeople = new Set(
        programAssignments
          .filter(
            (assignment) =>
              assignment.programId === program.id && assignment.status === "confirmed",
          )
          .map((assignment) => assignment.personId),
      ).size;

      return { program, activeInstances, upcomingInstances, assignedPeople };
    });
}

function buildUpcomingInstances(
  query: OperationsQuery | undefined,
  referenceDate: IsoDateTime,
): UpcomingInstanceRow[] {
  return selectProgramInstances(query)
    .filter((instance) => isUpcomingInstance(instance, referenceDate))
    .sort(compareInstances)
    .map((instance) => ({
      instance,
      programName: programsById.get(instance.programId)?.name ?? "Unknown Program",
    }));
}

function buildComplianceReadiness(): ComplianceReadinessRow[] {
  return requirementDefinitions
    .filter((definition) => definition.status === "active")
    .map((definition) => {
      const assignments = requirementAssignments.filter(
        (assignment) => assignment.requirementId === definition.id,
      );

      // `waived` and `expiring_soon` deliberately fall outside both buckets below,
      // so `complete + outstanding <= assigned` always holds.
      const complete = assignments.filter((assignment) => assignment.status === "complete").length;
      const outstanding = assignments.filter((assignment) =>
        ["not_started", "in_progress", "submitted", "expired"].includes(assignment.status),
      ).length;
      const expiringSoon = assignments.filter(
        (assignment) => assignment.status === "expiring_soon",
      ).length;

      return {
        requirementId: definition.id,
        requirementName: definition.name,
        category: definition.category,
        assigned: assignments.length,
        complete,
        outstanding,
        expiringSoon,
      };
    });
}

function buildFinanceWorkflow(query?: OperationsQuery): FinanceWorkflowRow[] {
  const records = financialRecords.filter(
    (record) =>
      matchesOrganization(record.organizationId, query) && matchesProgram(record.programId, query),
  );

  const stages = new Map<string, { count: number; totalMinor: number }>();
  for (const record of records) {
    const stage = stages.get(record.approvalState) ?? { count: 0, totalMinor: 0 };
    stages.set(record.approvalState, {
      count: stage.count + 1,
      totalMinor: stage.totalMinor + record.amountMinor,
    });
  }

  // Pipeline order, not insertion order, so the table reads the same way on
  // every render regardless of how the underlying records happen to be sorted.
  return STAGE_ORDER.filter((stage) => stages.has(stage)).map((stage) => {
    const totals = stages.get(stage) ?? { count: 0, totalMinor: 0 };
    return { stage, count: totals.count, totalMinor: totals.totalMinor };
  });
}

// ---------------------------------------------------------------------------
// Programs module
// ---------------------------------------------------------------------------

/**
 * The region catalogue is a projection of the region-kind organizations, not a
 * second table: an instance's `organizationId` and a grant's `organizationIds`
 * are the same identifiers these carry.
 */
const regionsById: ReadonlyMap<RegionId, Region> = new Map(
  organizations
    .filter((organization) => organization.kind === "region")
    .map((organization) => [
      organization.id,
      { id: organization.id, name: organization.name, code: organization.code },
    ]),
);

const instancesById = new Map<Id, ProgramInstance>(
  programInstances.map((instance) => [instance.id, instance]),
);

function normalize(value: string): string {
  return value.toLowerCase();
}

function matchesText(haystack: readonly (string | null)[], search: string | undefined): boolean {
  if (search === undefined) return true;
  const term = normalize(search.trim());
  if (term.length === 0) return true;
  return haystack.some((value) => value !== null && normalize(value).includes(term));
}

function eventsForInstance(instanceId: Id): ProgramEvent[] {
  return programEvents.filter((event) => event.programInstanceIds.includes(instanceId));
}

function signalsForInstance(instanceId: Id): readonly ReadinessSignal[] {
  return readinessSignals.filter((signal) => signal.programInstanceId === instanceId);
}

function toInstanceSummary(instance: ProgramInstance): ProgramInstanceSummary {
  return {
    instance,
    programName: programsById.get(instance.programId)?.name ?? "Unknown program",
    region: regionsById.get(instance.organizationId) ?? null,
    eventCount: eventsForInstance(instance.id).length,
    readiness: summarizeReadiness(signalsForInstance(instance.id)),
  };
}

function toEventRow(event: ProgramEvent): ProgramEventRow {
  const linked = event.programInstanceIds
    .map((instanceId) => instancesById.get(instanceId))
    .filter((instance): instance is ProgramInstance => instance !== undefined);

  const regions = new Map<RegionId, Region>();
  for (const instance of linked) {
    const region = regionsById.get(instance.organizationId);
    if (region) regions.set(region.id, region);
  }

  return {
    event,
    programName: programsById.get(event.programId)?.name ?? "Unknown program",
    instances: linked.map((instance) => ({
      id: instance.id,
      programId: instance.programId,
      name: instance.name,
      regionId: instance.organizationId,
    })),
    regions: [...regions.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Instance-level facets, shared by the programs list and the instance list. */
function matchesInstanceFacets(
  instance: ProgramInstance,
  filters: { cycleYear?: number; regionId?: RegionId; status?: ProgramInstance["status"] },
): boolean {
  if (filters.cycleYear !== undefined && instance.cycleYear !== filters.cycleYear) return false;
  if (filters.regionId !== undefined && instance.organizationId !== filters.regionId) return false;
  if (filters.status !== undefined && instance.status !== filters.status) return false;
  return true;
}

function instancesOfProgram(programId: Id): ProgramInstance[] {
  return programInstances.filter((instance) => instance.programId === programId);
}

function buildProgramSummaries(
  filters: ProgramFilters,
  referenceDate: IsoDateTime,
): ProgramSummary[] {
  // A facet narrows the *instances*, so a program with no instance left after
  // filtering drops out. A bare text search does not: searching a program by
  // name should still find it before its first session exists.
  const facetsActive =
    filters.cycleYear !== undefined ||
    filters.regionId !== undefined ||
    filters.status !== undefined;

  const summaries: ProgramSummary[] = [];

  for (const program of [...programs].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  )) {
    const candidates = instancesOfProgram(program.id).filter((instance) =>
      matchesInstanceFacets(instance, filters),
    );

    const programMatches = matchesText(
      [program.name, program.slug, program.summary],
      filters.search,
    );
    const matching = programMatches
      ? candidates
      : candidates.filter((instance) => matchesText([instance.name], filters.search));

    const included =
      (programMatches || matching.length > 0) && (!facetsActive || matching.length > 0);
    if (!included) continue;

    const instances = matching.sort(compareInstances).map(toInstanceSummary);
    summaries.push({ program, instances, ...countInstances(instances, referenceDate) });
  }

  return summaries;
}

function matchesEventFilters(
  event: ProgramEvent,
  filters: ProgramEventFilters,
  referenceDate: IsoDateTime,
): boolean {
  if (filters.programId !== undefined && event.programId !== filters.programId) return false;
  if (filters.eventType !== undefined && event.eventType !== filters.eventType) return false;

  const startDate = dateOnly(event.startsAt);
  if (filters.includePast !== true && startDate < dateOnly(referenceDate)) return false;
  if (filters.from !== undefined && startDate < filters.from) return false;
  if (filters.to !== undefined && startDate > filters.to) return false;

  const linked = event.programInstanceIds
    .map((instanceId) => instancesById.get(instanceId))
    .filter((instance): instance is ProgramInstance => instance !== undefined);

  if (filters.regionId !== undefined) {
    if (!linked.some((instance) => instance.organizationId === filters.regionId)) return false;
  }

  if (filters.cycleYear !== undefined) {
    // An event counts for a cycle if it happens in that year or serves an
    // instance from it — a January training for a summer cycle still belongs.
    const eventYear = Number(startDate.slice(0, 4));
    const matchesCycle =
      eventYear === filters.cycleYear ||
      linked.some((instance) => instance.cycleYear === filters.cycleYear);
    if (!matchesCycle) return false;
  }

  const programName = programsById.get(event.programId)?.name ?? null;
  return matchesText([event.title, event.audienceLabel, programName], filters.search);
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export function createMockOperationsRepository(): OperationsRepository {
  return {
    // Identity, applications and the portal live in their own module: this
    // file already runs to several hundred lines of Programs joins, and the
    // Luma 2.0 surfaces are a separate concern reading separate seed data.
    ...createLuma2RepositorySlice(),
    async getOverview(query?: OperationsQuery): Promise<OperationsOverview> {
      const referenceDate = resolveReferenceDate(query);

      return {
        generatedAt: referenceDate,
        portfolio: applyLimit(buildPortfolio(query, referenceDate), query),
        upcomingInstances: applyLimit(buildUpcomingInstances(query, referenceDate), query),
        upcomingEvents: applyLimit(selectUpcomingEventRows(query, referenceDate), query),
        attention: applyLimit(selectAttentionTasks(query, referenceDate), query),
        complianceReadiness: applyLimit(buildComplianceReadiness(), query),
        financeWorkflow: applyLimit(buildFinanceWorkflow(query), query),
        recentActivity: applyLimit(selectRecentAuditEvents(query), query),
        integrations: applyLimit(selectIntegrationConnections(query), query),
      };
    },

    async listPrograms(query?: OperationsQuery): Promise<readonly Program[]> {
      return applyLimit(selectPrograms(query), query);
    },

    async listProgramInstances(query?: OperationsQuery): Promise<readonly ProgramInstance[]> {
      return applyLimit(selectProgramInstances(query), query);
    },

    async listUpcomingProgramEvents(query?: OperationsQuery): Promise<readonly UpcomingEventRow[]> {
      const referenceDate = resolveReferenceDate(query);
      return applyLimit(selectUpcomingEventRows(query, referenceDate), query);
    },

    async listTasksRequiringAttention(query?: OperationsQuery): Promise<readonly Task[]> {
      const referenceDate = resolveReferenceDate(query);
      return applyLimit(selectAttentionTasks(query, referenceDate), query);
    },

    async listRecentAuditEvents(query?: OperationsQuery): Promise<readonly AuditEvent[]> {
      return applyLimit(selectRecentAuditEvents(query), query);
    },

    async listRegions(): Promise<readonly Region[]> {
      return [...regionsById.values()].sort((a, b) => a.name.localeCompare(b.name));
    },

    async listProgramCycleYears(): Promise<readonly number[]> {
      return [...new Set(programInstances.map((instance) => instance.cycleYear))].sort(
        (a, b) => a - b,
      );
    },

    async getProgram(programId: Id): Promise<Program | null> {
      return programsById.get(programId) ?? null;
    },

    async listProgramSummaries(filters: ProgramFilters = {}): Promise<readonly ProgramSummary[]> {
      return buildProgramSummaries(filters, resolveReferenceDate(filters));
    },

    async listProgramInstanceSummaries(
      filters: ProgramInstanceFilters = {},
    ): Promise<readonly ProgramInstanceSummary[]> {
      return programInstances
        .filter(
          (instance) =>
            (filters.programId === undefined || instance.programId === filters.programId) &&
            matchesInstanceFacets(instance, filters) &&
            matchesText([instance.name], filters.search),
        )
        .sort(compareInstances)
        .map(toInstanceSummary);
    },

    async getProgramInstance(programId: Id, instanceId: Id): Promise<ProgramInstance | null> {
      const instance = instancesById.get(instanceId);
      // A real instance under the wrong program is not a redirect and not a
      // partial render — as far as this contract is concerned it does not exist.
      if (!instance || instance.programId !== programId) return null;
      return instance;
    },

    async getProgramDetail(
      programId: Id,
      filters: { referenceDate?: IsoDateTime } = {},
    ): Promise<ProgramDetail | null> {
      const program = programsById.get(programId);
      if (!program) return null;

      const referenceDate = resolveReferenceDate(filters);
      const instances = instancesOfProgram(programId);

      const current = instances
        .filter((instance) => instance.status === "in_progress")
        .sort(compareInstances)
        .map(toInstanceSummary);

      const upcoming = instances
        .filter((instance) => instance.status !== "in_progress" && isInFlightInstance(instance))
        .sort(compareInstances)
        .map(toInstanceSummary);

      const completed = instances
        .filter((instance) => !isInFlightInstance(instance))
        .sort(compareInstancesDescending)
        .map(toInstanceSummary);

      const upcomingEvents = programEvents
        .filter((event) => matchesEventFilters(event, { programId }, referenceDate))
        .sort(compareEvents)
        .map(toEventRow);

      const signals = instances.flatMap((instance) => signalsForInstance(instance.id));

      return {
        program,
        current,
        upcoming,
        completed,
        upcomingEvents,
        readiness: rollupReadiness(signals),
      };
    },

    async getProgramInstanceDetail(
      programId: Id,
      instanceId: Id,
    ): Promise<ProgramInstanceDetail | null> {
      const instance = instancesById.get(instanceId);
      if (!instance || instance.programId !== programId) return null;

      const program = programsById.get(instance.programId);
      if (!program) return null;

      return {
        program,
        instance,
        region: regionsById.get(instance.organizationId) ?? null,
        events: eventsForInstance(instance.id).sort(compareEvents).map(toEventRow),
        readiness: sortReadinessSignals(signalsForInstance(instance.id)),
      };
    },

    async listProgramEvents(
      filters: ProgramEventFilters = {},
    ): Promise<readonly ProgramEventRow[]> {
      const referenceDate = resolveReferenceDate(filters);
      return programEvents
        .filter((event) => matchesEventFilters(event, filters, referenceDate))
        .sort(compareEvents)
        .map(toEventRow);
    },

    async listIntegrationConnections(
      query?: OperationsQuery,
    ): Promise<readonly IntegrationConnection[]> {
      return applyLimit(selectIntegrationConnections(query), query);
    },
  };
}

import {
  READINESS_AREAS,
  type IsoDate,
  type IsoDateTime,
  type ProgramEvent,
  type ProgramInstance,
  type ProgramInstanceStatus,
  type ReadinessSignal,
  type ReadinessStatus,
  type Region,
} from "../domain";
import type {
  ProgramEventRow,
  ProgramInstanceSummary,
  ProgramReadinessRollupRow,
  ReadinessSummary,
} from "./repository";

/**
 * Pure derivations shared by the repository and by authorization filtering.
 *
 * Both need to answer "how many of these instances are in flight?" — the
 * repository over everything, the visibility filter over the subset an actor
 * may see. Keeping one implementation here means a filtered page can never
 * disagree with an unfiltered one about what the numbers mean, and a future
 * Supabase repository reuses the same rules.
 */

/** Statuses where an instance is still live work rather than history. */
export const IN_FLIGHT_INSTANCE_STATUSES: ReadonlySet<ProgramInstanceStatus> = new Set([
  "planning",
  "applications_open",
  "confirmed",
  "in_progress",
]);

/** Statuses where an instance is finished, one way or another. */
export const CLOSED_INSTANCE_STATUSES: ReadonlySet<ProgramInstanceStatus> = new Set([
  "completed",
  "cancelled",
]);

/** Sorts after every real date, so undecided dates land last rather than first. */
const UNDATED_SORT_KEY = "9999-12-31";

export function instanceSortKey(instance: ProgramInstance): string {
  return instance.startDate ?? UNDATED_SORT_KEY;
}

export function dateOnly(value: IsoDate | IsoDateTime): string {
  return value.slice(0, 10);
}

/**
 * An instance is upcoming when it has not started. A start date in the future
 * says so outright; an undecided date says so as long as the instance has not
 * already been closed out.
 */
export function isUpcomingInstance(instance: ProgramInstance, referenceDate: IsoDateTime): boolean {
  if (CLOSED_INSTANCE_STATUSES.has(instance.status)) return false;
  if (instance.startDate === null) return true;
  return dateOnly(instance.startDate) >= dateOnly(referenceDate);
}

export function isInFlightInstance(instance: ProgramInstance): boolean {
  return IN_FLIGHT_INSTANCE_STATUSES.has(instance.status);
}

/** Deterministic everywhere: start date, then name, then id as a final tiebreak. */
export function compareInstances(a: ProgramInstance, b: ProgramInstance): number {
  const byDate = instanceSortKey(a).localeCompare(instanceSortKey(b));
  if (byDate !== 0) return byDate;
  const byName = a.name.localeCompare(b.name);
  return byName !== 0 ? byName : a.id.localeCompare(b.id);
}

/** Most recent first, for history. */
export function compareInstancesDescending(a: ProgramInstance, b: ProgramInstance): number {
  return -compareInstances(a, b);
}

export function compareEvents(a: ProgramEvent, b: ProgramEvent): number {
  const byStart = a.startsAt.localeCompare(b.startsAt);
  if (byStart !== 0) return byStart;
  const byTitle = a.title.localeCompare(b.title);
  return byTitle !== 0 ? byTitle : a.id.localeCompare(b.id);
}

export interface ProgramInstanceCounts {
  readonly instanceCount: number;
  readonly activeInstances: number;
  readonly upcomingInstances: number;
  readonly regions: readonly Region[];
  readonly cycleYears: readonly number[];
}

/**
 * Counts and facets for a set of instance summaries. Callers pass whichever
 * set is theirs to describe — all of them, or only the visible ones.
 */
export function countInstances(
  summaries: readonly ProgramInstanceSummary[],
  referenceDate: IsoDateTime,
): ProgramInstanceCounts {
  const regions = new Map<string, Region>();
  const years = new Set<number>();
  let activeInstances = 0;
  let upcomingInstances = 0;

  for (const summary of summaries) {
    if (summary.region) regions.set(summary.region.id, summary.region);
    years.add(summary.instance.cycleYear);
    if (isInFlightInstance(summary.instance)) activeInstances += 1;
    if (isUpcomingInstance(summary.instance, referenceDate)) upcomingInstances += 1;
  }

  return {
    instanceCount: summaries.length,
    activeInstances,
    upcomingInstances,
    regions: [...regions.values()].sort((a, b) => a.name.localeCompare(b.name)),
    cycleYears: [...years].sort((a, b) => a - b),
  };
}

/** Counts, never per-area detail, for list rows. */
export function summarizeReadiness(signals: readonly ReadinessSignal[]): ReadinessSummary {
  let tracked = 0;
  let ready = 0;
  let needsAttention = 0;

  for (const signal of signals) {
    if (signal.status === "not_applicable") continue;
    tracked += 1;
    if (signal.status === "ready") ready += 1;
    if (signal.status === "needs_attention") needsAttention += 1;
  }

  return { signals, tracked, ready, needsAttention };
}

const EMPTY_READINESS_COUNTS: Readonly<Record<ReadinessStatus, number>> = {
  not_started: 0,
  needs_attention: 0,
  in_progress: 0,
  ready: 0,
  not_applicable: 0,
};

/** One row per area, in the domain's fixed order, so the table never reshuffles. */
export function rollupReadiness(
  signals: readonly ReadinessSignal[],
): readonly ProgramReadinessRollupRow[] {
  return READINESS_AREAS.map((area) => {
    const counts = { ...EMPTY_READINESS_COUNTS };
    for (const signal of signals) {
      if (signal.area === area) counts[signal.status] += 1;
    }
    return { area, counts };
  }).filter((row) => Object.values(row.counts).some((count) => count > 0));
}

/** Sorts readiness signals into the fixed area order for detail views. */
export function sortReadinessSignals(
  signals: readonly ReadinessSignal[],
): readonly ReadinessSignal[] {
  const order = new Map(READINESS_AREAS.map((area, index) => [area, index]));
  return [...signals].sort((a, b) => {
    const byArea = (order.get(a.area) ?? 0) - (order.get(b.area) ?? 0);
    return byArea !== 0 ? byArea : a.id.localeCompare(b.id);
  });
}

export function compareEventRows(a: ProgramEventRow, b: ProgramEventRow): number {
  return compareEvents(a.event, b.event);
}

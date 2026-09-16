import type { IsoDateTime, Region } from "../domain";
import type {
  ProgramDetail,
  ProgramEventRow,
  ProgramInstanceDetail,
  ProgramInstanceSummary,
  ProgramSummary,
} from "../data/repository";
import { countInstances, rollupReadiness } from "../data/program-views";
import type { InstanceScopeRef, ProgramAccessPolicy } from "./program-access";

/**
 * Applies a `ProgramAccessPolicy` to what the repository returned.
 *
 * Route loaders call these before handing anything to a page, so a component
 * never has to decide what an actor may see. Counts and facets are recomputed
 * from the visible subset — a regional actor's "3 instances" means three they
 * can open, not three that exist.
 *
 * Filtering here is UI correctness. The same rules must exist as Row Level
 * Security policies before this module talks to a real database; a hidden row
 * that the server would still return is not protected.
 */

export function toInstanceScopeRef(summary: ProgramInstanceSummary): InstanceScopeRef {
  return {
    id: summary.instance.id,
    programId: summary.instance.programId,
    regionId: summary.instance.organizationId,
  };
}

/** Every instance referenced by a list of program summaries, for policy setup. */
export function collectInstanceScopeRefs(
  summaries: readonly ProgramSummary[],
): readonly InstanceScopeRef[] {
  return summaries.flatMap((summary) => summary.instances.map(toInstanceScopeRef));
}

export function filterInstanceSummaries(
  policy: ProgramAccessPolicy,
  summaries: readonly ProgramInstanceSummary[],
): readonly ProgramInstanceSummary[] {
  return summaries.filter((summary) => policy.canViewInstance(toInstanceScopeRef(summary)));
}

/**
 * Drops programs the actor cannot reach and, for those they can, narrows the
 * instance list and re-derives the counts from what is left.
 */
export function filterProgramSummaries(
  policy: ProgramAccessPolicy,
  summaries: readonly ProgramSummary[],
  referenceDate: IsoDateTime,
): readonly ProgramSummary[] {
  const visible: ProgramSummary[] = [];

  for (const summary of summaries) {
    const instances = filterInstanceSummaries(policy, summary.instances);
    const reachable = policy.canViewProgramDirectly(summary.program.id) || instances.length > 0;
    if (!reachable) continue;

    visible.push({
      program: summary.program,
      instances,
      ...countInstances(instances, referenceDate),
    });
  }

  return visible;
}

/** Keeps only the linked instances (and therefore regions) the actor may see. */
export function filterEventRows(
  policy: ProgramAccessPolicy,
  rows: readonly ProgramEventRow[],
): readonly ProgramEventRow[] {
  const visible: ProgramEventRow[] = [];

  for (const row of rows) {
    if (
      !policy.canViewEvent({
        programId: row.event.programId,
        programInstanceIds: row.event.programInstanceIds,
      })
    ) {
      continue;
    }

    const instances = row.instances.filter((instance) =>
      policy.canViewInstance({
        id: instance.id,
        programId: instance.programId,
        regionId: instance.regionId,
      }),
    );
    const regionIds = new Set(instances.map((instance) => instance.regionId));
    const regions: readonly Region[] = row.regions.filter((region) => regionIds.has(region.id));

    visible.push({ ...row, instances, regions });
  }

  return visible;
}

/** `null` means "deny", not "empty": the route turns it into a not-found. */
export function filterProgramDetail(
  policy: ProgramAccessPolicy,
  detail: ProgramDetail,
): ProgramDetail | null {
  if (!policy.canViewProgram(detail.program.id)) return null;

  const current = filterInstanceSummaries(policy, detail.current);
  const upcoming = filterInstanceSummaries(policy, detail.upcoming);
  const completed = filterInstanceSummaries(policy, detail.completed);

  // The readiness roll-up spans instances, so it is rebuilt from the signals
  // of the visible ones. Inheriting the unfiltered roll-up would report on
  // instances the actor is not allowed to know about.
  const visibleSignals = [...current, ...upcoming, ...completed].flatMap(
    (summary) => summary.readiness.signals,
  );

  return {
    program: detail.program,
    current,
    upcoming,
    completed,
    upcomingEvents: filterEventRows(policy, detail.upcomingEvents),
    readiness: rollupReadiness(visibleSignals),
  };
}

export function filterInstanceDetail(
  policy: ProgramAccessPolicy,
  detail: ProgramInstanceDetail,
): ProgramInstanceDetail | null {
  const allowed = policy.canViewInstance({
    id: detail.instance.id,
    programId: detail.instance.programId,
    regionId: detail.instance.organizationId,
  });
  if (!allowed) return null;

  return { ...detail, events: filterEventRows(policy, detail.events) };
}

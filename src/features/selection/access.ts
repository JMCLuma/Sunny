import type { AuthorizationService, OperationsAction } from "@/features/operations/auth";
import type { ApplicationQueueRow, SelectionBoard } from "@/features/operations/data";
import type { ApplicationStatus, Id, Interview, RegionId } from "@/features/operations/domain";

/**
 * Scope decisions for Applications & selection.
 *
 * Programs has `auth/program-access.ts`; this is the same idea asked of the
 * `applications` resource, and it is separate for a reason that matters more
 * here than there. An application carries far more about a person than a
 * session record does, so answering "may you see this?" with the *programs*
 * permission would let a programs-only grant open a queue of applicants —
 * precisely the conflation this module must not make.
 *
 * Three questions rather than one, because the personas genuinely differ on
 * them: viewing the queue (`applications.view`), scoring (`applications.update`)
 * and deciding (`applications.approve`). The reviewer persona holds the first
 * two and not the third, so decision controls have to be absent for them
 * rather than fail on click.
 *
 * Pure: no React, no routing, no data access. Route loaders build a policy from
 * the sessions the repository returned and narrow results before a page renders.
 * This is UI gating. The identical rules belong in Row Level Security when
 * Supabase lands — a reviewer's query must return no rows for another camp, not
 * merely rows the browser declines to paint.
 */

/** The minimum a session must expose for a scope decision. */
export interface ApplicationScopeRef {
  readonly instanceId: Id;
  readonly programId: Id;
  readonly regionId: RegionId;
}

export interface ApplicationAccessPolicy {
  /** May the actor see applications belonging to this session at all? */
  canViewInstance(instanceId: Id): boolean;
  /** May the actor score against this session's rubric? */
  canScoreInstance(instanceId: Id): boolean;
  /** May the actor accept, waitlist or reject in this session? */
  canDecideInstance(instanceId: Id): boolean;
  /** Export is its own permission: reading a queue is not taking it away. */
  canExportInstance(instanceId: Id): boolean;
  /** Sessions in scope, so filter facets only offer reachable values. */
  readonly reachable: readonly ApplicationScopeRef[];
}

/**
 * @param instances every session relevant to the decision — the full set the
 * repository knows about, not the filtered page, so a filter can never widen
 * what an actor sees.
 */
export function createApplicationAccessPolicy(
  authorization: AuthorizationService,
  instances: readonly ApplicationScopeRef[],
): ApplicationAccessPolicy {
  const byId = new Map<Id, ApplicationScopeRef>(
    instances.map((instance) => [instance.instanceId, instance]),
  );
  const caches = new Map<OperationsAction, Map<Id, boolean>>();

  function allows(instanceId: Id, action: OperationsAction): boolean {
    let cache = caches.get(action);
    if (!cache) {
      cache = new Map();
      caches.set(action, cache);
    }
    const cached = cache.get(instanceId);
    if (cached !== undefined) return cached;

    const instance = byId.get(instanceId);
    // An unknown session cannot be shown to be in scope, so it is not: a row
    // naming a session this policy was never told about is denied.
    const allowed =
      instance !== undefined &&
      (authorization.can({ resource: "applications", action, scope: "all" }) ||
        authorization.can({
          resource: "applications",
          action,
          scope: "program",
          programId: instance.programId,
        }) ||
        authorization.can({
          resource: "applications",
          action,
          scope: "assigned_program",
          programId: instance.programId,
        }) ||
        authorization.can({
          resource: "applications",
          action,
          scope: "region",
          organizationId: instance.regionId,
          programId: instance.programId,
        }));

    cache.set(instanceId, allowed);
    return allowed;
  }

  return {
    canViewInstance: (instanceId) => allows(instanceId, "view"),
    canScoreInstance: (instanceId) => allows(instanceId, "update"),
    canDecideInstance: (instanceId) => allows(instanceId, "approve"),
    canExportInstance: (instanceId) => allows(instanceId, "export"),
    reachable: instances.filter((instance) => allows(instance.instanceId, "view")),
  };
}

/** Drops rows whose session the actor may not see. */
export function filterQueueRows(
  policy: ApplicationAccessPolicy,
  rows: readonly ApplicationQueueRow[],
): readonly ApplicationQueueRow[] {
  return rows.filter((row) => policy.canViewInstance(row.submission.programInstanceId));
}

/** Status and region tallies derived from a row set, never inherited. */
export function recountBoard(rows: readonly ApplicationQueueRow[]): {
  readonly countsByStatus: Readonly<Record<ApplicationStatus, number>>;
  readonly countsByRegion: readonly { readonly label: string; readonly count: number }[];
} {
  const countsByStatus = {} as Record<ApplicationStatus, number>;
  const byRegion = new Map<string, number>();

  for (const row of rows) {
    countsByStatus[row.submission.status] = (countsByStatus[row.submission.status] ?? 0) + 1;
    const label = row.regionName ?? "Unassigned";
    byRegion.set(label, (byRegion.get(label) ?? 0) + 1);
  }

  return {
    countsByStatus,
    countsByRegion: [...byRegion.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  };
}

/**
 * Narrows a selection board and rebuilds its counts from what is left.
 *
 * `null` means deny rather than empty, so the route reports a not-found instead
 * of rendering a page that confirms the cohort exists.
 */
export function filterSelectionBoard(
  policy: ApplicationAccessPolicy,
  board: SelectionBoard,
): SelectionBoard | null {
  if (!policy.canViewInstance(board.programInstanceId)) return null;

  const rows = filterQueueRows(policy, board.rows);
  if (rows.length === board.rows.length) return board;

  return { ...board, rows, ...recountBoard(rows) };
}

/**
 * Keeps only interviews attached to a submission the actor may see.
 *
 * An `Interview` names no program of its own, so reachability is decided by the
 * submissions already filtered above: an interview for a submission that is not
 * in the visible set is dropped, not assumed safe.
 */
export function filterInterviews(
  interviews: readonly Interview[],
  visibleSubmissionIds: ReadonlySet<Id>,
): readonly Interview[] {
  return interviews.filter((interview) => visibleSubmissionIds.has(interview.submissionId));
}

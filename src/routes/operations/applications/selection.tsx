import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";

import { OperationsNotFound, OperationsRouteError } from "@/features/operations/components";
import { createApplicationAccessPolicy, filterSelectionBoard } from "@/features/selection/access";
import { toApplicationScopeRef } from "@/features/selection/application-scope";
import {
  DEFAULT_SELECTION_SORT,
  parseSelectionSearch,
} from "@/features/selection/application-filters";
import { sortQueueRows, summarizeCohort } from "@/features/selection/view-models";
import { SelectionPage } from "@/features/selection/pages";

/** Mosaic Fall 2026 is the demo's flagship cohort; other reachable sessions still work. */
const DEFAULT_SELECTION_INSTANCE = "inst_mosaic_fall_ne";

/**
 * The decision screen.
 *
 * `filterSelectionBoard` re-applies the same access policy to the board the
 * repository returns and recomputes its counts, so a board reachable in
 * principle but requested for the wrong session still resolves to a
 * not-found rather than a page confirming the cohort exists. Bulk decisions
 * are only ever offered when `canDecideInstance` is true for the selected
 * session — a reviewer sees the same board a camp lead does, just without the
 * controls that would record a decision.
 */
export const Route = createFileRoute("/operations/applications/selection")({
  validateSearch: parseSelectionSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { authorization, repository } = context.operations;

    const allInstances = await repository.listProgramInstances();
    const instancesById = new Map(allInstances.map((instance) => [instance.id, instance]));
    const policy = createApplicationAccessPolicy(
      authorization,
      allInstances.map(toApplicationScopeRef),
    );

    const reachable = policy.reachable;
    const selectedInstanceId =
      (deps.instance && reachable.some((ref) => ref.instanceId === deps.instance)
        ? deps.instance
        : (reachable.find((ref) => ref.instanceId === DEFAULT_SELECTION_INSTANCE)?.instanceId ??
          reachable[0]?.instanceId)) ?? null;

    if (!selectedInstanceId) throw notFound();

    const board = await repository.getSelectionBoard(selectedInstanceId);
    if (!board) throw notFound();

    const filtered = filterSelectionBoard(policy, board);
    if (!filtered) throw notFound();

    const cohort = summarizeCohort(filtered.rows, filtered.plannedCapacity);
    const tableRows = deps.status
      ? filtered.rows.filter((row) => row.submission.status === deps.status)
      : filtered.rows;
    const sort = deps.sort ?? DEFAULT_SELECTION_SORT.sort;
    const dir = deps.dir ?? DEFAULT_SELECTION_SORT.dir;

    return {
      board: filtered,
      cohort,
      rows: sortQueueRows(tableRows, sort, dir),
      canDecide: policy.canDecideInstance(selectedInstanceId),
      instances: reachable.map((ref) => ({
        id: ref.instanceId,
        name: instancesById.get(ref.instanceId)?.name ?? "Unknown session",
      })),
    };
  },
  component: SelectionRoute,
  notFoundComponent: () => (
    <OperationsNotFound
      title="No cohort to show"
      message="No selection board matches this address, or it is outside your access."
    />
  ),
  errorComponent: OperationsRouteError,
});

function SelectionRoute() {
  const { board, cohort, rows, canDecide, instances } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <SelectionPage
      board={board}
      cohort={cohort}
      rows={rows}
      canDecide={canDecide}
      instances={instances}
      search={search}
      onSearchChange={(next) => navigate({ search: next })}
      onDecide={async (submissionIds, outcome) => {
        await repository.recordDecisions(submissionIds, outcome);
        await router.invalidate();
      }}
    />
  );
}

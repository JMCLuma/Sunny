import { createFileRoute } from "@tanstack/react-router";

import { OperationsRouteError } from "@/features/operations/components";
import type { ApplicationQueueFilters } from "@/features/operations/data";
import {
  createApplicationAccessPolicy,
  filterQueueRows,
  recountBoard,
} from "@/features/selection/access";
import { toApplicationScopeRef } from "@/features/selection/application-scope";
import { parseQueueSearch } from "@/features/selection/application-filters";
import { ApplicationQueuePage } from "@/features/selection/pages";

/**
 * The applications queue.
 *
 * The module gate (`applications.tsx`) only asked "any Applications access at
 * all?". This loader is where that gets narrowed: the policy is built from
 * every instance the repository knows about — not the filtered rows — so a
 * `?program=` a URL sets can never widen what the actor is shown, only pick
 * among what they already could see. Counts come from `recountBoard` over the
 * same filtered rows the table renders, so the summary line and the table
 * never disagree about what "38 applications" means.
 */
export const Route = createFileRoute("/operations/applications/")({
  validateSearch: parseQueueSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { authorization, repository } = context.operations;

    const filters: ApplicationQueueFilters = {
      ...(deps.program !== undefined ? { programId: deps.program } : {}),
      ...(deps.instance !== undefined ? { programInstanceId: deps.instance } : {}),
      ...(deps.region !== undefined ? { regionId: deps.region } : {}),
      ...(deps.audience !== undefined ? { audience: deps.audience } : {}),
      ...(deps.status !== undefined ? { status: deps.status } : {}),
      ...(deps.q !== undefined ? { search: deps.q } : {}),
    };

    const [allInstances, allRegions, allPrograms, queue] = await Promise.all([
      repository.listProgramInstances(),
      repository.listRegions(),
      repository.listPrograms(),
      repository.listApplicationQueue(filters),
    ]);

    const policy = createApplicationAccessPolicy(
      authorization,
      allInstances.map(toApplicationScopeRef),
    );
    const rows = filterQueueRows(policy, queue);
    const counts = recountBoard(rows);

    const reachableProgramIds = new Set(policy.reachable.map((ref) => ref.programId));
    const reachableRegionIds = new Set(policy.reachable.map((ref) => ref.regionId));
    const reachableInstanceIds = new Set(policy.reachable.map((ref) => ref.instanceId));

    return {
      rows,
      counts,
      programs: allPrograms.filter((program) => reachableProgramIds.has(program.id)),
      regions: allRegions.filter((region) => reachableRegionIds.has(region.id)),
      instances: allInstances
        .filter((instance) => reachableInstanceIds.has(instance.id))
        .map((instance) => ({ id: instance.id, name: instance.name })),
      canExport: policy.reachable.some((ref) => policy.canExportInstance(ref.instanceId)),
    };
  },
  component: ApplicationQueueRoute,
  errorComponent: OperationsRouteError,
});

function ApplicationQueueRoute() {
  const { rows, counts, programs, regions, instances, canExport } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <ApplicationQueuePage
      rows={rows}
      counts={counts}
      programs={programs}
      regions={regions}
      instances={instances}
      canExport={canExport}
      search={search}
      onSearchChange={(next) => navigate({ search: next })}
    />
  );
}

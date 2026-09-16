import { createFileRoute } from "@tanstack/react-router";

import {
  collectInstanceScopeRefs,
  createProgramAccessPolicy,
  filterInstanceSummaries,
  filterProgramSummaries,
  requireAccess,
  toInstanceScopeRef,
} from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { parseProgramsSearch } from "@/features/operations/program-filters";
import { ProgramsPage } from "@/features/operations/pages";
import type { ProgramFilters } from "@/features/operations/data";

/**
 * Programs portfolio.
 *
 * Filter state is validated out of the URL, the repository answers the query,
 * and the access policy narrows the answer before the page sees it. The policy
 * is built from *every* instance the repository knows about rather than the
 * filtered page, so a filter can never widen what an actor may see — and
 * facet options only offer values that actor can actually reach.
 */
export const Route = createFileRoute("/operations/programs/")({
  validateSearch: parseProgramsSearch,
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("programs").access);
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { authorization, repository } = context.operations;
    const referenceDate = new Date().toISOString();

    const filters: ProgramFilters = {
      referenceDate,
      ...(deps.q !== undefined ? { search: deps.q } : {}),
      ...(deps.year !== undefined ? { cycleYear: deps.year } : {}),
      ...(deps.region !== undefined ? { regionId: deps.region } : {}),
      ...(deps.status !== undefined ? { status: deps.status } : {}),
    };

    const [summaries, everyInstance, regions, cycleYears] = await Promise.all([
      repository.listProgramSummaries(filters),
      repository.listProgramInstanceSummaries({ referenceDate }),
      repository.listRegions(),
      repository.listProgramCycleYears(),
    ]);

    const policy = createProgramAccessPolicy(authorization, [
      ...everyInstance.map(toInstanceScopeRef),
      ...collectInstanceScopeRefs(summaries),
    ]);

    const reachable = filterInstanceSummaries(policy, everyInstance);
    const reachableRegionIds = new Set(reachable.map((row) => row.instance.organizationId));
    const reachableYears = new Set(reachable.map((row) => row.instance.cycleYear));

    return {
      programs: filterProgramSummaries(policy, summaries, referenceDate),
      regions: regions.filter((region) => reachableRegionIds.has(region.id)),
      cycleYears: cycleYears.filter((year) => reachableYears.has(year)),
    };
  },
  component: ProgramsRoute,
  errorComponent: OperationsRouteError,
});

function ProgramsRoute() {
  const { programs, regions, cycleYears } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <ProgramsPage
      programs={programs}
      regions={regions}
      cycleYears={cycleYears}
      search={search}
      onSearchChange={(next) => navigate({ search: next })}
    />
  );
}

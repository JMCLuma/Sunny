import { createFileRoute } from "@tanstack/react-router";

import {
  createProgramAccessPolicy,
  filterEventRows,
  filterInstanceSummaries,
  requireAccess,
  toInstanceScopeRef,
} from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { parseEventsSearch } from "@/features/operations/program-filters";
import { EventsPage } from "@/features/operations/pages";
import type { ProgramEventFilters } from "@/features/operations/data";

/**
 * The program event schedule: one row per event, however many instances it
 * serves. A regional actor sees a shared training once, with only the linked
 * instances they may reach.
 */
export const Route = createFileRoute("/operations/programs/events")({
  validateSearch: parseEventsSearch,
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("programs").access);
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { authorization, repository } = context.operations;
    const referenceDate = new Date().toISOString();

    const filters: ProgramEventFilters = {
      referenceDate,
      ...(deps.q !== undefined ? { search: deps.q } : {}),
      ...(deps.program !== undefined ? { programId: deps.program } : {}),
      ...(deps.year !== undefined ? { cycleYear: deps.year } : {}),
      ...(deps.type !== undefined ? { eventType: deps.type } : {}),
      ...(deps.region !== undefined ? { regionId: deps.region } : {}),
    };

    const [events, everyInstance, programs, regions, cycleYears] = await Promise.all([
      repository.listProgramEvents(filters),
      repository.listProgramInstanceSummaries({ referenceDate }),
      repository.listPrograms(),
      repository.listRegions(),
      repository.listProgramCycleYears(),
    ]);

    const policy = createProgramAccessPolicy(authorization, everyInstance.map(toInstanceScopeRef));
    const reachable = filterInstanceSummaries(policy, everyInstance);
    const reachableRegionIds = new Set(reachable.map((row) => row.instance.organizationId));
    const reachableYears = new Set(reachable.map((row) => row.instance.cycleYear));

    return {
      crumb: { label: "Event schedule" },
      events: filterEventRows(policy, events),
      programs: programs
        .filter((program) => policy.canViewProgram(program.id))
        .map((program) => ({ id: program.id, name: program.name })),
      regions: regions.filter((region) => reachableRegionIds.has(region.id)),
      cycleYears: cycleYears.filter((year) => reachableYears.has(year)),
    };
  },
  component: EventsRoute,
  errorComponent: OperationsRouteError,
});

function EventsRoute() {
  const { events, programs, regions, cycleYears } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <EventsPage
      events={events}
      programs={programs}
      regions={regions}
      cycleYears={cycleYears}
      search={search}
      onSearchChange={(next) => navigate({ search: next })}
    />
  );
}

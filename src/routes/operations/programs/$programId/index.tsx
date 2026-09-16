import { createFileRoute, notFound } from "@tanstack/react-router";

import {
  createProgramAccessPolicy,
  filterProgramDetail,
  toInstanceScopeRef,
} from "@/features/operations/auth";
import { OperationsNotFound, OperationsRouteError } from "@/features/operations/components";
import { ProgramDetailPage } from "@/features/operations/pages";

/**
 * Program detail. The parent route has already established that this program
 * exists and is reachable; this loader fetches the detail and re-applies the
 * policy to its instances and events, so nothing outside an actor's scope is
 * rendered even though the program itself is visible to them.
 */
export const Route = createFileRoute("/operations/programs/$programId/")({
  loader: async ({ context, params }) => {
    const { authorization, repository } = context.operations;
    const referenceDate = new Date().toISOString();

    const detail = await repository.getProgramDetail(params.programId, { referenceDate });
    if (!detail) throw notFound();

    const instances = [...detail.current, ...detail.upcoming, ...detail.completed];
    const policy = createProgramAccessPolicy(authorization, instances.map(toInstanceScopeRef));

    const visible = filterProgramDetail(policy, detail);
    if (!visible) throw notFound();

    return { detail: visible };
  },
  component: ProgramDetailRoute,
  notFoundComponent: () => (
    <OperationsNotFound
      title="Program not found"
      message="No program matches this address, or it is outside your access."
    />
  ),
  errorComponent: OperationsRouteError,
});

function ProgramDetailRoute() {
  return <ProgramDetailPage detail={Route.useLoaderData().detail} />;
}

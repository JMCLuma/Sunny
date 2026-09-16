import { createFileRoute, notFound } from "@tanstack/react-router";

import {
  createProgramAccessPolicy,
  filterInstanceDetail,
  toInstanceScopeRef,
} from "@/features/operations/auth";
import { OperationsNotFound, OperationsRouteError } from "@/features/operations/components";
import { InstanceDetailPage } from "@/features/operations/pages";

/**
 * Program instance detail.
 *
 * The repository resolves the instance by *both* ids: a real instance asked
 * for under another program's id comes back null and is reported as not found,
 * never rendered under the wrong parent.
 */
export const Route = createFileRoute("/operations/programs/$programId/instances/$instanceId")({
  loader: async ({ context, params }) => {
    const { authorization, repository } = context.operations;
    const referenceDate = new Date().toISOString();

    const [detail, siblings] = await Promise.all([
      repository.getProgramInstanceDetail(params.programId, params.instanceId),
      repository.listProgramInstanceSummaries({ programId: params.programId, referenceDate }),
    ]);
    if (!detail) throw notFound();

    const policy = createProgramAccessPolicy(authorization, siblings.map(toInstanceScopeRef));
    const visible = filterInstanceDetail(policy, detail);
    if (!visible) throw notFound();

    return { detail: visible, crumb: { label: visible.instance.name } };
  },
  component: InstanceDetailRoute,
  notFoundComponent: () => (
    <OperationsNotFound
      title="Session not found"
      message="No session matches this address under this program, or it is outside your access."
    />
  ),
  errorComponent: OperationsRouteError,
});

function InstanceDetailRoute() {
  return <InstanceDetailPage detail={Route.useLoaderData().detail} />;
}

import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { OverviewPage } from "@/features/operations/pages";

/**
 * Operations overview. The loader is the only place data is fetched; the page
 * component receives it as a prop and knows nothing about the repository.
 */
export const Route = createFileRoute("/operations/")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("overview").access);
  },
  loader: ({ context }) => context.operations.repository.getOverview(),
  component: OperationsOverviewRoute,
  errorComponent: OperationsRouteError,
});

function OperationsOverviewRoute() {
  return <OverviewPage overview={Route.useLoaderData()} />;
}

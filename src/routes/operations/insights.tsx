import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { ModulePage } from "@/features/operations/pages";

export const Route = createFileRoute("/operations/insights")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("insights").access);
  },
  component: InsightsRoute,
  errorComponent: OperationsRouteError,
});

function InsightsRoute() {
  return <ModulePage moduleId="insights" />;
}

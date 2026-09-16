import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { ModulePage } from "@/features/operations/pages";

export const Route = createFileRoute("/operations/marketing")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("marketing").access);
  },
  component: MarketingRoute,
  errorComponent: OperationsRouteError,
});

function MarketingRoute() {
  return <ModulePage moduleId="marketing" />;
}

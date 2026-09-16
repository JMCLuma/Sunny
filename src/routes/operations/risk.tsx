import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { ModulePage } from "@/features/operations/pages";

export const Route = createFileRoute("/operations/risk")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("risk").access);
  },
  component: RiskRoute,
  errorComponent: OperationsRouteError,
});

function RiskRoute() {
  return <ModulePage moduleId="risk" />;
}

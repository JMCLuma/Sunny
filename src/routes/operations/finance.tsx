import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { ModulePage } from "@/features/operations/pages";

export const Route = createFileRoute("/operations/finance")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("finance").access);
  },
  component: FinanceRoute,
  errorComponent: OperationsRouteError,
});

function FinanceRoute() {
  return <ModulePage moduleId="finance" />;
}

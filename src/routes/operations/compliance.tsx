import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { ModulePage } from "@/features/operations/pages";

export const Route = createFileRoute("/operations/compliance")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("compliance").access);
  },
  component: ComplianceRoute,
  errorComponent: OperationsRouteError,
});

function ComplianceRoute() {
  return <ModulePage moduleId="compliance" />;
}

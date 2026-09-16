import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { ModulePage } from "@/features/operations/pages";

export const Route = createFileRoute("/operations/admin")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("admin").access);
  },
  component: AdminRoute,
  errorComponent: OperationsRouteError,
});

function AdminRoute() {
  return <ModulePage moduleId="admin" />;
}

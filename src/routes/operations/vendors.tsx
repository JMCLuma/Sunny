import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { ModulePage } from "@/features/operations/pages";

export const Route = createFileRoute("/operations/vendors")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("vendors").access);
  },
  component: VendorsRoute,
  errorComponent: OperationsRouteError,
});

function VendorsRoute() {
  return <ModulePage moduleId="vendors" />;
}

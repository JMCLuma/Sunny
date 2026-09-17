import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { ModuleOutlinePage } from "@/features/operations/pages/module-pages/module-outline-page";
import { getOperationsModule } from "@/features/operations/navigation";

const MODULE = getOperationsModule("admin");

export const Route = createFileRoute("/operations/admin")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, MODULE.access);
  },
  component: () => <ModuleOutlinePage module={MODULE} />,
  errorComponent: OperationsRouteError,
});

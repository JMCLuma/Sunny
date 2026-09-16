import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { ModulePage } from "@/features/operations/pages";

export const Route = createFileRoute("/operations/documents")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("documents").access);
  },
  component: DocumentsRoute,
  errorComponent: OperationsRouteError,
});

function DocumentsRoute() {
  return <ModulePage moduleId="documents" />;
}

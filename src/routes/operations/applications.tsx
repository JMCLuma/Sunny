import { createFileRoute } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { ModulePlaceholder } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";

const MODULE = getOperationsModule("applications");

export const Route = createFileRoute("/operations/applications")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, MODULE.access);
  },
  component: () => <ModulePlaceholder module={MODULE} />,
});

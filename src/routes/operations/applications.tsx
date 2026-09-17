import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";

/**
 * Layout for the Applications & selection module.
 *
 * The module gate only asks whether the actor holds Applications access at
 * all — a camp-scoped reviewer must be able to open the module and then see
 * their camp. What they actually see is narrowed inside each screen, the same
 * split Programs already uses.
 */
export const Route = createFileRoute("/operations/applications")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("applications").access);
  },
  component: () => <Outlet />,
  errorComponent: OperationsRouteError,
});

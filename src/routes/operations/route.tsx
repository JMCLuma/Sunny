import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AuthorizationProvider, requireAccess } from "@/features/operations/auth";
import { OperationsRouteError, OperationsShell } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";

/**
 * Layout route for the whole Operations module.
 *
 * `beforeLoad` enforces the module-level permission before anything renders.
 * It runs on the server during SSR and again on client navigation, so a direct
 * hit or a refresh is checked exactly like a click.
 *
 * The public `SiteHeader` is not rendered anywhere under this route — it
 * belongs to the `_public` layout.
 */
export const Route = createFileRoute("/operations")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("overview").access);
  },
  component: OperationsLayout,
  errorComponent: OperationsRouteError,
});

function OperationsLayout() {
  const { operations } = Route.useRouteContext();

  return (
    <AuthorizationProvider authorization={operations.authorization}>
      <OperationsShell>
        <Outlet />
      </OperationsShell>
    </AuthorizationProvider>
  );
}

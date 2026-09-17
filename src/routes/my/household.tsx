import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout for `/my/household` and `/my/household/$profileId`.
 *
 * A bare layout, not the list itself — the list lives in `household.index.tsx`
 * so the detail route renders in place of it instead of underneath it. See
 * `programs.tsx` for the same split, for the same reason.
 */
export const Route = createFileRoute("/my/household")({
  component: () => <Outlet />,
});

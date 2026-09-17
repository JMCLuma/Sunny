import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout for `/my/programs` and `/my/programs/$instanceId`.
 *
 * A bare layout, not the list itself — see `programs.index.tsx`.
 */
export const Route = createFileRoute("/my/programs")({
  component: () => <Outlet />,
});

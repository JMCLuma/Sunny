import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout for the Applications area — the list at the index and one wizard or
 * read-only record per submission underneath it.
 *
 * A pure layout, the same shape as `/operations/applications`: this file's
 * only job is the `<Outlet />`, so `/my/applications` (the list) and
 * `/my/applications/$submissionId` (one application) can share a URL prefix
 * without either screen carrying the other's concerns.
 */
export const Route = createFileRoute("/my/applications")({
  component: () => <Outlet />,
});

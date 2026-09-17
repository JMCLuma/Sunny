import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/features/portal/pages/dashboard-page";

/**
 * The household dashboard — the most-visited screen in the product.
 *
 * `accountId` is null for an Operations persona previewing My Luma; the page
 * renders a clear empty state rather than the route refusing to load, since
 * this surface is scoped by whose records you may see, not by a permission
 * grant (see `my.tsx`).
 */
export const Route = createFileRoute("/my/")({
  loader: async ({ context }) => {
    const { accountId, repository } = context.operations;
    const overview = accountId ? await repository.getHouseholdOverview(accountId) : null;
    return { overview };
  },
  component: DashboardRoute,
});

function DashboardRoute() {
  return <DashboardPage overview={Route.useLoaderData().overview} />;
}

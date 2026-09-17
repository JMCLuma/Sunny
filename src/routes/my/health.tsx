import { createFileRoute, useRouter } from "@tanstack/react-router";

import { findEntryForTarget } from "@/features/portal/checklist-view";
import { HealthPage } from "@/features/portal/pages/health-page";

/**
 * Health forms. No repository backs this screen — Health has no write
 * contract in this wireframe — but it still finds which checklist item (if
 * any) sent the family here, so submitting can mark that item done.
 */
export const Route = createFileRoute("/my/health")({
  loader: async ({ context }) => {
    const { accountId, repository } = context.operations;
    const views = accountId ? await repository.listChecklists(accountId) : [];
    return { location: findEntryForTarget(views, "health") };
  },
  component: HealthRoute,
});

function HealthRoute() {
  const { location } = Route.useLoaderData();
  const { repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <HealthPage
      location={location}
      onComplete={
        location
          ? async () => {
              await repository.completeChecklistItem(
                location.entry.definition.id,
                location.view.profileId,
              );
              await router.invalidate();
            }
          : undefined
      }
    />
  );
}

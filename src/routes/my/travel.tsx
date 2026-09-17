import { createFileRoute, useRouter } from "@tanstack/react-router";

import { findEntryForTarget } from "@/features/portal/checklist-view";
import { TravelPage } from "@/features/portal/pages/travel-page";

export const Route = createFileRoute("/my/travel")({
  loader: async ({ context }) => {
    const { accountId, repository } = context.operations;
    const views = accountId ? await repository.listChecklists(accountId) : [];
    return { location: findEntryForTarget(views, "travel") };
  },
  component: TravelRoute,
});

function TravelRoute() {
  const { location } = Route.useLoaderData();
  const { repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <TravelPage
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

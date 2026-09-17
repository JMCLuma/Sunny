import { createFileRoute, useRouter } from "@tanstack/react-router";

import { findEntryForTarget } from "@/features/portal/checklist-view";
import { WaiversPage } from "@/features/portal/pages/waivers-page";

export const Route = createFileRoute("/my/waivers")({
  loader: async ({ context }) => {
    const { accountId, repository } = context.operations;
    const views = accountId ? await repository.listChecklists(accountId) : [];
    return { location: findEntryForTarget(views, "waivers") };
  },
  component: WaiversRoute,
});

function WaiversRoute() {
  const { location } = Route.useLoaderData();
  const { repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <WaiversPage
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

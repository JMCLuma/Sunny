import { createFileRoute, useRouter } from "@tanstack/react-router";

import { findEntryForTarget } from "@/features/portal/checklist-view";
import { PaymentPage } from "@/features/portal/pages/payment-page";

export const Route = createFileRoute("/my/payment")({
  loader: async ({ context }) => {
    const { accountId, repository } = context.operations;
    const views = accountId ? await repository.listChecklists(accountId) : [];
    return { location: findEntryForTarget(views, "payment") };
  },
  component: PaymentRoute,
});

function PaymentRoute() {
  const { location } = Route.useLoaderData();
  const { repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <PaymentPage
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

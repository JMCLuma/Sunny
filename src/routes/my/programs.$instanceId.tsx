import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";

import { ChecklistPage } from "@/features/portal/pages/checklist-page";
import { parseChecklistSearch } from "@/features/portal/checklist-view";

/**
 * One camp's checklist.
 *
 * `profile` normally arrives in the URL from `CampChecklistCard`'s link, but
 * a bare `/my/programs/$instanceId` still has to go somewhere sensible, so a
 * missing profile is resolved from the household's own checklists instead of
 * failing outright.
 */
export const Route = createFileRoute("/my/programs/$instanceId")({
  validateSearch: parseChecklistSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const { accountId, repository } = context.operations;
    if (!accountId) throw notFound();

    let profileId = deps.profile;
    if (!profileId) {
      const all = await repository.listChecklists(accountId);
      profileId = all.find((view) => view.programInstanceId === params.instanceId)?.profileId;
    }
    if (!profileId) throw notFound();

    const view = await repository.getChecklist(profileId, params.instanceId);
    if (!view) throw notFound();
    return { view };
  },
  component: ChecklistRoute,
  notFoundComponent: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">Checklist not found</h1>
      <p className="text-muted-foreground">
        No checklist matches this address, or it isn't part of your household.
      </p>
    </div>
  ),
});

function ChecklistRoute() {
  const { view } = Route.useLoaderData();
  const { repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <ChecklistPage
      view={view}
      onComplete={async (definitionId) => {
        await repository.completeChecklistItem(definitionId, view.profileId);
        await router.invalidate();
      }}
    />
  );
}

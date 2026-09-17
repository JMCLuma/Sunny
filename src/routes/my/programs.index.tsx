import { createFileRoute } from "@tanstack/react-router";

import { ProgramsPage } from "@/features/portal/pages/programs-page";

/**
 * "My camps": every accepted place, each with its own checklist.
 *
 * Split from `programs.tsx` (a bare layout) so `/my/programs/$instanceId`
 * renders the checklist detail in place of this list instead of underneath
 * it — the same reason `programs/$programId` in Operations splits into a
 * `route.tsx` layout and an `index.tsx`.
 */
export const Route = createFileRoute("/my/programs/")({
  loader: async ({ context }) => {
    const { accountId, repository } = context.operations;
    const views = accountId ? await repository.listChecklists(accountId) : [];
    return { views };
  },
  component: ProgramsIndexRoute,
});

function ProgramsIndexRoute() {
  return <ProgramsPage views={Route.useLoaderData().views} />;
}

import { createFileRoute, useRouter } from "@tanstack/react-router";

import type { PendingOutcomes } from "@/features/identity/pages/household-page";
import { HouseholdPage } from "@/features/identity/pages/household-page";

/**
 * Family — the profile list, and the relationship/access model made visible.
 *
 * Split from `household.tsx` (a bare layout) the same way `programs.index.tsx`
 * is split from `programs.tsx`: the parent file only renders `<Outlet />`, so
 * a nested `/my/household/$profileId` shows the detail page instead of the
 * list rendering underneath it.
 *
 * `today` is computed once here, in the loader, rather than read from the
 * clock during render: a loader runs once per navigation and its result is
 * what both the server render and the hydrating client see, so this is the
 * one place a "now" can be read without risking a mismatch.
 */
export const Route = createFileRoute("/my/household/")({
  loader: async ({ context }) => {
    const { accountId, repository } = context.operations;
    if (!accountId) {
      return {
        overview: null,
        relationships: [],
        grants: [],
        today: referenceToday(),
        pendingOutcomes: new Map() as PendingOutcomes,
      };
    }

    const [overview, relationships, grants, openReviews] = await Promise.all([
      repository.getHouseholdOverview(accountId),
      repository.listRelationships(accountId),
      repository.listAccessGrants(accountId),
      repository.listMatchReviews("open"),
    ]);

    const householdProfileIds = new Set(
      (overview?.profiles ?? []).map((entry) => entry.profile.id),
    );
    const pendingOutcomes: PendingOutcomes = new Map(
      openReviews
        .filter((row) => householdProfileIds.has(row.review.profileId))
        .map((row) => [row.review.profileId, row.review.outcome]),
    );

    return { overview, relationships, grants, today: referenceToday(), pendingOutcomes };
  },
  component: HouseholdIndexRoute,
});

function referenceToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function HouseholdIndexRoute() {
  const { overview, relationships, grants, today, pendingOutcomes } = Route.useLoaderData();
  const { accountId, repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <HouseholdPage
      overview={overview}
      relationships={relationships}
      grants={grants}
      today={today}
      pendingOutcomes={pendingOutcomes}
      onAddProfile={async (draft) => {
        if (!accountId) throw new Error("No household to add a profile to");
        const profile = await repository.addProfile(accountId, draft);
        await repository.resolveProfileMatch(profile.id);
        await router.invalidate();
        return profile;
      }}
    />
  );
}

import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";

import { HouseholdDetailPage } from "@/features/identity/pages/household-detail-page";
import { buildAccessView } from "@/features/identity/access-view";
import { ageAt } from "@/features/operations/domain";

/**
 * One profile's detail.
 *
 * The loader refuses a profile outside the signed-in account the same way
 * Operations refuses a program outside an actor's scope: a not-found rather
 * than a message that confirms the record exists under someone else's
 * household.
 */
export const Route = createFileRoute("/my/household/$profileId")({
  loader: async ({ context, params }) => {
    const { accountId, repository } = context.operations;
    const profile = await repository.getProfile(params.profileId);
    if (!profile || !accountId || profile.accountId !== accountId) throw notFound();

    const today = new Date().toISOString().slice(0, 10);
    const [profiles, relationships, grants, openReviews] = await Promise.all([
      repository.listProfiles(accountId),
      repository.listRelationships(accountId),
      repository.listAccessGrants(accountId),
      repository.listMatchReviews("open"),
    ]);

    const access = buildAccessView(profiles, relationships, grants, today);
    const accessRows = access.rows.filter((row) => row.subjectProfileId === profile.id);
    const review = openReviews.find((row) => row.review.profileId === profile.id) ?? null;

    return {
      profile,
      age: ageAt(profile.dateOfBirth, today),
      accessRows,
      reviewOutcome: review?.review.outcome ?? null,
    };
  },
  component: HouseholdDetailRoute,
  notFoundComponent: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">Profile not found</h1>
      <p className="text-muted-foreground">
        No profile matches this address, or it isn't part of your household.
      </p>
    </div>
  ),
});

function HouseholdDetailRoute() {
  const { profile, age, accessRows, reviewOutcome } = Route.useLoaderData();
  const { repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <HouseholdDetailPage
      profile={profile}
      age={age}
      accessRows={accessRows}
      reviewOutcome={reviewOutcome}
      onSave={async (patch) => {
        await repository.updateProfile(profile.id, patch);
        await router.invalidate();
      }}
    />
  );
}

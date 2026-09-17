import { createFileRoute, useRouter } from "@tanstack/react-router";

import { parseApplySearch } from "@/features/applications/apply-search";
import { ApplyPage } from "@/features/applications/pages";
import type { EligibleInstanceRow } from "@/features/operations/data";

/**
 * Choose who is applying, then which of their eligible camps to start.
 *
 * `listEligibleInstances` already ran the eligibility engine for both
 * audiences; this route's only job is to fetch that answer and hand it to the
 * page whole. Nothing is filtered out here — a "not eligible" row is data the
 * page explains, never an omission the loader makes.
 */
export const Route = createFileRoute("/my/apply")({
  validateSearch: parseApplySearch,
  loaderDeps: ({ search }) => ({ profile: search.profile }),
  loader: async ({ context, deps }) => {
    const { repository, accountId } = context.operations;
    const referenceDate = new Date().toISOString();

    if (!accountId) {
      return {
        accountId: null,
        profiles: [],
        selectedProfileId: null,
        participant: [],
        staff: [],
        referenceDate,
      } as const;
    }

    const profiles = await repository.listProfiles(accountId);
    // A URL profile wins if it is still one of this household's own; a
    // single-profile household (an adult applying for themselves) needs no
    // picker step at all.
    const fromUrl =
      deps.profile && profiles.some((profile) => profile.id === deps.profile) ? deps.profile : null;
    const selectedProfileId = fromUrl ?? (profiles.length === 1 ? (profiles[0]?.id ?? null) : null);

    const [participant, staff] = selectedProfileId
      ? await Promise.all([
          repository.listEligibleInstances(selectedProfileId, "participant"),
          repository.listEligibleInstances(selectedProfileId, "staff"),
        ])
      : [[] as readonly EligibleInstanceRow[], [] as readonly EligibleInstanceRow[]];

    return { accountId, profiles, selectedProfileId, participant, staff, referenceDate } as const;
  },
  component: ApplyRoute,
});

function ApplyRoute() {
  const data = Route.useLoaderData();
  const { operations } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  const router = useRouter();

  async function handleStartApplications(rows: readonly EligibleInstanceRow[]) {
    if (!data.selectedProfileId) return;
    for (const row of rows) {
      if (!row.formId) continue;
      await operations.repository.startApplication(data.selectedProfileId, row.formId);
    }
    await router.invalidate();
    void navigate({ to: "/my/applications" });
  }

  return (
    <ApplyPage
      accountId={data.accountId}
      profiles={data.profiles}
      selectedProfileId={data.selectedProfileId}
      participantRows={data.participant}
      staffRows={data.staff}
      referenceDate={data.referenceDate}
      onSelectProfile={(profileId) => void navigate({ search: { profile: profileId } })}
      onStartApplications={handleStartApplications}
    />
  );
}

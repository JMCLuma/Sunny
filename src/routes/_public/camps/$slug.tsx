import { createFileRoute, notFound } from "@tanstack/react-router";

import { getCampProfile } from "@/features/public/camp-catalogue";
import { CampDetailPage } from "@/features/public/pages/camp-detail-page";

export const Route = createFileRoute("/_public/camps/$slug")({
  loader: async ({ context, params }) => {
    const camp = getCampProfile(params.slug);
    if (!camp) throw notFound();

    const { repository } = context.operations;
    const programs = await repository.listPrograms();
    const program = programs.find((entry) => entry.slug === params.slug);

    const criteria = program
      ? await repository.listEligibilityCriteria({
          programId: program.id,
          audience: "participant",
        })
      : [];

    // The public page states the rules; it does not judge a visitor who has
    // not told us anything, so eligibility is evaluated against an empty
    // subject and only `criteria` is read from each row.
    const rows = await repository.evaluateEligibilityForSubject(
      {
        dateOfBirth: null,
        risingSecularGrade: null,
        risingRecGrade: null,
        regionId: null,
        hasAttendedBefore: false,
      },
      "participant",
    );

    const ids = new Set(criteria.map((entry) => entry.programInstanceId));
    return { camp, sessions: rows.filter((row) => ids.has(row.instance.id)) };
  },
  component: CampDetail,
});

function CampDetail() {
  const { camp, sessions } = Route.useLoaderData();
  return <CampDetailPage camp={camp} sessions={sessions} />;
}

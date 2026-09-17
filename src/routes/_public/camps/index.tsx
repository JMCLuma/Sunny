import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { FindMyCampPage } from "@/features/public/pages/find-my-camp-page";
import {
  parseCampSearch,
  toEligibilitySubject,
  type CampSearch,
} from "@/features/public/camp-search";

/** "Today" for the age maths, pinned so the page is stable across renders. */
const TODAY = "2026-09-17";

export const Route = createFileRoute("/_public/camps/")({
  validateSearch: parseCampSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { repository } = context.operations;
    const [regions, rows] = await Promise.all([
      repository.listRegions(),
      // The same evaluator the signed-in path uses, so a family is never told
      // one thing before registering and another after.
      repository.evaluateEligibilityForSubject(toEligibilitySubject(deps, TODAY), "participant"),
    ]);
    return { regions, rows };
  },
  component: FindMyCamp,
});

function FindMyCamp() {
  const { regions, rows } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <FindMyCampPage
      search={search}
      regions={regions}
      rows={rows}
      onChange={(next: Partial<CampSearch>) =>
        navigate({ search: (previous) => ({ ...previous, ...next }), replace: true })
      }
    />
  );
}

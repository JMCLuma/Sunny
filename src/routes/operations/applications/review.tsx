import { createFileRoute, useRouter } from "@tanstack/react-router";

import { OperationsRouteError } from "@/features/operations/components";
import { createApplicationAccessPolicy, filterQueueRows } from "@/features/selection/access";
import { toApplicationScopeRef } from "@/features/selection/application-scope";
import { isBlind, parseReviewSearch } from "@/features/selection/application-filters";
import { draftCriterionScores } from "@/features/selection/view-models";
import { ReviewPage } from "@/features/selection/pages";

/**
 * Blind review and scoring.
 *
 * Only sessions the actor may score (`applications.update`) are offered at
 * all — a reviewer who could view but not score a session would otherwise be
 * shown a "Score" button that fails on click, which is exactly the failure
 * mode the module's access rules exist to prevent. The submission open in the
 * scoring panel is re-checked against the same filtered row set before it is
 * ever handed to the page, so a hand-edited `?submission=` cannot open an
 * application outside the actor's scope.
 */
export const Route = createFileRoute("/operations/applications/review")({
  validateSearch: parseReviewSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { authorization, repository } = context.operations;

    const allInstances = await repository.listProgramInstances();
    const instancesById = new Map(allInstances.map((instance) => [instance.id, instance]));
    const policy = createApplicationAccessPolicy(
      authorization,
      allInstances.map(toApplicationScopeRef),
    );

    const scorable = policy.reachable.filter((ref) => policy.canScoreInstance(ref.instanceId));
    const instances = scorable.map((ref) => ({
      id: ref.instanceId,
      name: instancesById.get(ref.instanceId)?.name ?? "Unknown session",
    }));

    const selectedInstanceId =
      (deps.instance && scorable.some((ref) => ref.instanceId === deps.instance)
        ? deps.instance
        : scorable[0]?.instanceId) ?? null;

    const rubric = selectedInstanceId
      ? ((await repository.listRubrics(selectedInstanceId))[0] ?? null)
      : null;

    const blind = isBlind(deps);
    const rawRows = selectedInstanceId
      ? await repository.listApplicationQueue({ programInstanceId: selectedInstanceId, blind })
      : [];
    const rows = filterQueueRows(policy, rawRows);

    const panelRow = deps.submission
      ? rows.find((row) => row.submission.id === deps.submission)
      : undefined;
    const panel =
      panelRow && rubric
        ? {
            row: panelRow,
            draftScores: draftCriterionScores(
              rubric,
              (await repository.listScores(panelRow.submission.id))[0]?.criterionScores,
            ),
          }
        : null;

    return {
      instances,
      selectedInstanceId,
      rubric,
      rows,
      identified: !blind,
      canScore: selectedInstanceId !== null && policy.canScoreInstance(selectedInstanceId),
      panel,
    };
  },
  component: ReviewRoute,
  errorComponent: OperationsRouteError,
});

function ReviewRoute() {
  const { instances, selectedInstanceId, rubric, rows, identified, canScore, panel } =
    Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <ReviewPage
      instances={instances}
      selectedInstanceId={selectedInstanceId}
      rubric={rubric}
      rows={rows}
      identified={identified}
      canScore={canScore}
      panel={panel}
      search={search}
      onSearchChange={(next) => navigate({ search: next })}
      onScoreSubmit={async (submissionId, rubricId, scores) => {
        await repository.scoreApplication(submissionId, rubricId, scores);
        await router.invalidate();
      }}
    />
  );
}

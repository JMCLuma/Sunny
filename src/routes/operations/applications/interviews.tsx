import { createFileRoute } from "@tanstack/react-router";

import { OperationsRouteError } from "@/features/operations/components";
import {
  createApplicationAccessPolicy,
  filterInterviews,
  filterQueueRows,
} from "@/features/selection/access";
import { toApplicationScopeRef } from "@/features/selection/application-scope";
import { parseInterviewsSearch } from "@/features/selection/interviews-filters";
import { summarizeInterviews } from "@/features/selection/view-models";
import { InterviewsPage } from "@/features/selection/pages";

/**
 * Interviews across whichever sessions the actor's scope reaches.
 *
 * `filterInterviews` needs the set of submissions the actor may already see,
 * so the loader always resolves the full (permission-filtered) queue first —
 * for every reachable session when none is picked — and only then narrows to
 * the interviews attached to those submissions. An interview naming a
 * submission outside that set is dropped, not shown with the applicant
 * blanked out.
 */
export const Route = createFileRoute("/operations/applications/interviews")({
  validateSearch: parseInterviewsSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { authorization, repository } = context.operations;

    const allInstances = await repository.listProgramInstances();
    const instancesById = new Map(allInstances.map((instance) => [instance.id, instance]));
    const policy = createApplicationAccessPolicy(
      authorization,
      allInstances.map(toApplicationScopeRef),
    );
    const reachable = policy.reachable;

    const selectedInstanceId =
      deps.instance && reachable.some((ref) => ref.instanceId === deps.instance)
        ? deps.instance
        : undefined;

    const [queue, allInterviews, directory] = await Promise.all([
      repository.listApplicationQueue(
        selectedInstanceId ? { programInstanceId: selectedInstanceId } : {},
      ),
      repository.listInterviews(selectedInstanceId),
      repository.listPersonDirectory(),
    ]);

    const visibleRows = filterQueueRows(policy, queue);
    const rowsBySubmission = new Map(visibleRows.map((row) => [row.submission.id, row]));
    const namesByPerson = new Map(
      directory.map((entry) => [entry.person.id, entry.person.displayName]),
    );

    const visibleInterviews = filterInterviews(allInterviews, new Set(rowsBySubmission.keys()));

    const joined = visibleInterviews
      .map((interview) => {
        const row = rowsBySubmission.get(interview.submissionId);
        if (!row) return null;
        return {
          interview,
          applicantLabel: row.applicantLabel,
          programName: row.programName,
          instanceName: row.instanceName,
          interviewerName: interview.interviewerPersonId
            ? (namesByPerson.get(interview.interviewerPersonId) ?? null)
            : null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const summary = summarizeInterviews(joined.map((row) => row.interview));
    const rows = deps.status
      ? joined.filter((row) => row.interview.status === deps.status)
      : joined;

    return {
      rows,
      summary,
      instances: reachable.map((ref) => ({
        id: ref.instanceId,
        name: instancesById.get(ref.instanceId)?.name ?? "Unknown session",
      })),
    };
  },
  component: InterviewsRoute,
  errorComponent: OperationsRouteError,
});

function InterviewsRoute() {
  const { rows, summary, instances } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <InterviewsPage
      rows={rows}
      summary={summary}
      instances={instances}
      search={search}
      onSearchChange={(next) => navigate({ search: next })}
    />
  );
}

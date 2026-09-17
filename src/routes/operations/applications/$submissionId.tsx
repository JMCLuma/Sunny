import { createFileRoute, notFound } from "@tanstack/react-router";

import { OperationsNotFound, OperationsRouteError } from "@/features/operations/components";
import type { ApplicationSubmission } from "@/features/operations/domain";
import { createApplicationAccessPolicy } from "@/features/selection/access";
import { toApplicationScopeRef } from "@/features/selection/application-scope";
import { isBlind, parseSubmissionSearch } from "@/features/selection/application-filters";
import { SubmissionDetailPage } from "@/features/selection/pages";

/**
 * One application, in full.
 *
 * `listApplicationQueue` — not `getSubmissionDetail` alone — is what supplies
 * the applicant label here, because it is the only place that knows how to
 * withhold it under blind mode. A submission still in `draft` never reaches
 * that queue at all (a half-finished form is the family's business until they
 * submit it), so this route resolves to not-found for one exactly as it would
 * for an id that never existed — nothing distinguishes the two responses.
 *
 * Blind mode is enforced here, not only in the page. Every question the form
 * pre-fills from a profile or account is stripped out of `submission.answers`
 * before the loader returns, so a withheld name or Jamatkhana never reaches
 * the client at all — not even in the SSR payload a reviewer could read from
 * view-source. The page's own section filtering is what a person actually
 * sees; this is what keeps the data behind it from leaking alongside it.
 */
export const Route = createFileRoute("/operations/applications/$submissionId")({
  validateSearch: parseSubmissionSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const { authorization, repository } = context.operations;

    const detail = await repository.getSubmissionDetail(params.submissionId);
    if (!detail) throw notFound();

    const allInstances = await repository.listProgramInstances();
    const policy = createApplicationAccessPolicy(
      authorization,
      allInstances.map(toApplicationScopeRef),
    );
    if (!policy.canViewInstance(detail.submission.programInstanceId)) throw notFound();

    const blind = isBlind(deps);
    const queueRows = await repository.listApplicationQueue({
      programInstanceId: detail.submission.programInstanceId,
      blind,
    });
    const queueRow = queueRows.find((entry) => entry.submission.id === params.submissionId);
    if (!queueRow) throw notFound();

    const [scores, rubrics, interviews] = await Promise.all([
      repository.listScores(params.submissionId),
      repository.listRubrics(detail.submission.programInstanceId),
      repository.listInterviews(detail.submission.programInstanceId),
    ]);

    // Redacted before any of it leaves the loader — the page's section filter
    // decides what a person sees, but this is what keeps the withheld answer
    // out of the hydration payload entirely. `queueRow` carries its own copy
    // of the submission, so both have to be redacted the same way or the
    // withheld answer would still ship inside the row.
    const identifyingQuestionIds = new Set(
      detail.form.questions
        .filter((question) => question.prefillFrom !== undefined)
        .map((question) => question.id),
    );
    function redact(entry: ApplicationSubmission): ApplicationSubmission {
      if (!blind) return entry;
      return {
        ...entry,
        answers: entry.answers.filter((answer) => !identifyingQuestionIds.has(answer.questionId)),
      };
    }

    return {
      row: { ...queueRow, submission: redact(queueRow.submission) },
      submission: redact(detail.submission),
      form: detail.form,
      scores,
      rubric: rubrics[0] ?? null,
      interview: interviews.find((entry) => entry.submissionId === params.submissionId) ?? null,
      identified: !blind,
    };
  },
  component: SubmissionDetailRoute,
  notFoundComponent: () => (
    <OperationsNotFound
      title="Application not found"
      message="No application matches this address, or it is outside your access."
    />
  ),
  errorComponent: OperationsRouteError,
});

function SubmissionDetailRoute() {
  const { row, submission, form, scores, rubric, interview, identified } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  return (
    <SubmissionDetailPage
      row={row}
      submission={submission}
      form={form}
      scores={scores}
      rubric={rubric}
      interview={interview}
      identified={identified}
      onIdentifiedChange={(next) => navigate({ search: next ? { identified: true } : {} })}
    />
  );
}

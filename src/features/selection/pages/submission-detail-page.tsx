import { Bot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { OperationsSection } from "@/features/operations/components";
import { StatusBadge } from "@/features/operations/components/status-badge";
import type { ApplicationQueueRow } from "@/features/operations/data";
import type {
  ApplicationForm,
  ApplicationSubmission,
  ApplicationScore,
  Interview,
  ScoringRubric,
} from "@/features/operations/domain";
import { formatDate, formatDateTime, formatLabel } from "@/features/operations/format";
import { BlindModeSwitch } from "../components/blind-mode-switch";
import {
  answersBySection,
  confirmationState,
  formatAnswerValue,
  maxWeightedTotal,
  weightedTotal,
} from "../view-models";

/**
 * One application, in full: answers, scores, interview and the current
 * decision.
 *
 * Arriving here from blind review must not undo the review's whole point, so
 * `identified` is respected the same way the queue and review screens respect
 * it — the applicant's name and every question the form pre-fills from their
 * profile or account (`prefillFrom`) are withheld together, since a school or
 * a Jamatkhana narrows down who someone is almost as fast as a name does.
 */
export function SubmissionDetailPage({
  row,
  submission,
  form,
  scores,
  rubric,
  interview,
  identified,
  onIdentifiedChange,
}: {
  row: ApplicationQueueRow;
  submission: ApplicationSubmission;
  form: ApplicationForm;
  scores: readonly ApplicationScore[];
  rubric: ScoringRubric | null;
  interview: Interview | null;
  identified: boolean;
  onIdentifiedChange: (identified: boolean) => void;
}) {
  const sections = answersBySection(form, submission.answers).filter(
    (section) => identified || section.section.kind !== "profile_confirmation",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{row.applicantLabel}</h1>
          <p className="text-sm text-muted-foreground">
            {row.programName} · {row.instanceName}
            {row.regionName ? ` · ${row.regionName}` : ""}
            {row.age !== null ? ` · age ${row.age}` : ""}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <BlindModeSwitch identified={identified} onChange={onIdentifiedChange} />

      {submission.status === "accepted" && submission.confirmByDate ? (
        <OperationsSection id="confirmation" title="Awaiting confirmation">
          <p className="text-sm text-muted-foreground">
            Accepted, with a place held until{" "}
            <strong>{formatDate(submission.confirmByDate)}</strong>. If the family hasn't confirmed
            by then, this application moves back to the waitlist automatically — that deadline is
            what makes the waitlist work.
          </p>
        </OperationsSection>
      ) : null}

      {submission.backgroundCheckRequired ? (
        <OperationsSection id="background-check" title="Background check">
          <p className="text-sm text-muted-foreground">
            {submission.backgroundCheckStatus
              ? formatLabel(submission.backgroundCheckStatus)
              : "Not started"}
            . This camp requires a cleared check before onboarding.
          </p>
        </OperationsSection>
      ) : null}

      <OperationsSection
        id="scores"
        title="Scores"
        {...(rubric ? { description: `${rubric.name} · v${rubric.version}` } : {})}
      >
        {scores.length === 0 || !rubric ? (
          <p className="text-sm text-muted-foreground">Not scored yet.</p>
        ) : (
          <div className="space-y-4">
            {scores.map((score) => {
              const confirmation = confirmationState(score.criterionScores);
              return (
                <div key={score.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {weightedTotal(score.criterionScores, rubric)} of {maxWeightedTotal(rubric)}{" "}
                      points
                    </p>
                    <div className="flex items-center gap-2">
                      {!confirmation.signedOff ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-highlight bg-highlight/25 text-highlight-foreground"
                        >
                          <Bot className="size-3" aria-hidden="true" />
                          {confirmation.awaitingHuman.length} unconfirmed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Human-confirmed</Badge>
                      )}
                      {score.submittedAt ? (
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(score.submittedAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {score.criterionScores.map((entry) => {
                      const criterion = rubric.criteria.find((c) => c.id === entry.criterionId);
                      return (
                        <li
                          key={entry.criterionId}
                          className="flex items-center justify-between text-sm text-muted-foreground"
                        >
                          <span>
                            {criterion?.label ?? entry.criterionId}
                            {entry.aiSuggested ? " (AI-suggested, unconfirmed)" : ""}
                          </span>
                          <span className="tabular-nums">
                            {entry.points}
                            {criterion ? ` / ${criterion.maxPoints}` : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </OperationsSection>

      <OperationsSection id="interview" title="Interview">
        {interview ? (
          <div className="space-y-1 text-sm">
            <p>
              <StatusBadge status={interview.status} />
            </p>
            {interview.scheduledFor ? (
              <p className="text-muted-foreground">{formatDateTime(interview.scheduledFor)}</p>
            ) : null}
            {interview.notes ? (
              <p className="text-muted-foreground">
                Notes on file.
                {interview.notesPurgeAfter
                  ? ` Purged ${formatDate(interview.notesPurgeAfter)}, per IUSA's retention rule.`
                  : ""}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No interview recorded.</p>
        )}
      </OperationsSection>

      <OperationsSection
        id="decision"
        title="Decision"
        description="The repository exposes each submission's current outcome, not a full history of every change to it."
      >
        {row.decision ? (
          <StatusBadge status={row.decision} />
        ) : (
          <p className="text-sm text-muted-foreground">No decision recorded yet.</p>
        )}
      </OperationsSection>

      <OperationsSection id="answers" title="Application answers">
        {!identified ? (
          <p className="mb-3 text-sm text-muted-foreground">
            Identity withheld under blind review: the profile-confirmation section and any answer
            pulled from the applicant's profile or account are hidden below.
          </p>
        ) : null}
        <div className="space-y-4">
          {sections.map(({ section, questions }) => (
            <div key={section.id}>
              <h3 className="text-sm font-bold">{section.title}</h3>
              <dl className="mt-2 space-y-2">
                {questions
                  .filter((entry) => identified || entry.question.prefillFrom === undefined)
                  .map(({ question, answer }) => (
                    <div key={question.id} className="text-sm">
                      <dt className="text-muted-foreground">{question.label}</dt>
                      <dd>{formatAnswerValue(answer, question)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </div>
      </OperationsSection>
    </div>
  );
}

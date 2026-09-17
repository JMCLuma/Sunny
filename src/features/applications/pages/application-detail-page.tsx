import { Button } from "@/components/ui/button";
import { PortalPageHeader } from "@/features/portal/components/portal-page-header";
import { PortalSection } from "@/features/portal/components/portal-section";
import type { ApplicationAnswer, Id } from "@/features/operations/domain";
import type { SubmissionDetail } from "@/features/operations/data";

import { formatAnswerValue } from "../answer-summary";
import { AcceptedOfferPanel } from "../components/accepted-offer-panel";
import { ApplicationStatusBadge } from "../components/application-status-badge";
import { BackgroundCheckNotice } from "../components/background-check-notice";
import { PrefillConfirmBar, PrefillTag } from "../components/prefill-confirm-bar";
import { QuestionField } from "../components/question-field";
import { WizardStepper } from "../components/wizard-stepper";
import { useApplicationWizard } from "../wizard/use-application-wizard";
import { needsPrefillConfirmation, orderedSections } from "../wizard/completion";
import { visibleQuestions } from "../wizard/visibility";
import { buildInitialAnswers } from "../wizard/answers";
import { presentStatus, profileDisplayName } from "../view-models";

/**
 * One application: the interactive wizard while it is still a draft, a
 * read-only record once it has been sent.
 *
 * Editing after submission is not a smaller version of this screen, it is a
 * different screen — nothing here can still be wrong in a way the applicant
 * may fix, so the fields stop being inputs and become the answer read back.
 */
export function ApplicationDetailPage({
  detail,
  referenceDate,
  confirming,
  onSaveAnswers,
  onSubmitApplication,
  onConfirmPlace,
}: {
  detail: SubmissionDetail;
  referenceDate: string;
  confirming: boolean;
  onSaveAnswers: (
    answers: readonly ApplicationAnswer[],
    completedSectionIds: readonly Id[],
  ) => Promise<unknown>;
  onSubmitApplication: () => Promise<unknown>;
  onConfirmPlace: () => void;
}) {
  if (detail.submission.status === "draft") {
    return (
      <ApplicationWizard
        detail={detail}
        onSaveAnswers={onSaveAnswers}
        onSubmitApplication={onSubmitApplication}
      />
    );
  }

  return (
    <SubmittedApplicationView
      detail={detail}
      referenceDate={referenceDate}
      confirming={confirming}
      onConfirmPlace={onConfirmPlace}
    />
  );
}

function ApplicationWizard({
  detail,
  onSaveAnswers,
  onSubmitApplication,
}: {
  detail: SubmissionDetail;
  onSaveAnswers: (
    answers: readonly ApplicationAnswer[],
    completedSectionIds: readonly Id[],
  ) => Promise<unknown>;
  onSubmitApplication: () => Promise<unknown>;
}) {
  const wizard = useApplicationWizard({
    detail,
    onSave: onSaveAnswers,
    onSubmit: onSubmitApplication,
  });
  const { form, profile } = detail;
  const { section } = wizard;

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title={form.title}
        backTo="/my/applications"
        backLabel="Applications"
        meta={`${profileDisplayName(profile)} · ${detail.instanceName}`}
      />

      <WizardStepper
        sections={wizard.sections}
        currentIndex={wizard.stepIndex}
        completedSectionIds={wizard.completedSectionIds}
        onStepClick={wizard.goToStep}
      />

      {section ? (
        <PortalSection
          id="wizard-step"
          title={section.title}
          {...(section.description ? { description: section.description } : {})}
        >
          {needsPrefillConfirmation(form, section.id) ? (
            <PrefillConfirmBar
              confirmed={wizard.prefillConfirmed}
              invalid={wizard.showErrors && !wizard.prefillConfirmed}
              onConfirm={wizard.confirmPrefill}
            />
          ) : null}

          <div className="space-y-5">
            {wizard.questions.map((question) => {
              const answer = wizard.answers.get(question.id);
              return (
                <div key={question.id} className="space-y-1.5">
                  {question.prefillFrom ? <PrefillTag /> : null}
                  <QuestionField
                    question={question}
                    value={answer?.value}
                    fileName={answer?.fileName}
                    invalid={wizard.showErrors && wizard.missing.some((m) => m.id === question.id)}
                    onChange={(value, fileName) => wizard.setAnswer(question.id, value, fileName)}
                  />
                </div>
              );
            })}
          </div>
        </PortalSection>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={wizard.stepIndex === 0}
          onClick={() => wizard.goToStep(wizard.stepIndex - 1)}
        >
          Back
        </Button>

        <SaveIndicator state={wizard.saveState} />

        {wizard.isLastStep ? (
          <Button type="button" onClick={wizard.submit} disabled={wizard.submitting}>
            {wizard.submitting ? "Submitting…" : "Submit application"}
          </Button>
        ) : (
          <Button type="button" onClick={wizard.continueStep}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "failed" }) {
  if (state === "idle") return <span aria-hidden />;
  const text =
    state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Couldn't save — try again";
  return (
    <p
      className={`text-xs ${state === "failed" ? "text-destructive" : "text-muted-foreground"}`}
      role="status"
    >
      {text}
    </p>
  );
}

function SubmittedApplicationView({
  detail,
  referenceDate,
  confirming,
  onConfirmPlace,
}: {
  detail: SubmissionDetail;
  referenceDate: string;
  confirming: boolean;
  onConfirmPlace: () => void;
}) {
  const { submission, form, profile, account } = detail;
  const presentation = presentStatus(submission.status);
  // A prefilled question the applicant never retyped is still an answer they
  // confirmed, not a gap — so the read-back resolves it the same way the
  // wizard did rather than showing "not answered" for something that was.
  const answers = buildInitialAnswers(form, submission, profile, account);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title={form.title}
        backTo="/my/applications"
        backLabel="Applications"
        meta={`${profileDisplayName(profile)} · ${detail.instanceName}`}
      />

      <PortalSection
        id="status"
        title="Status"
        action={<ApplicationStatusBadge status={submission.status} />}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{presentation.summary}</p>

          {submission.status === "accepted" ? (
            <AcceptedOfferPanel
              confirmByDate={submission.confirmByDate}
              referenceDate={referenceDate}
              confirming={confirming}
              onConfirm={onConfirmPlace}
            />
          ) : null}

          {submission.backgroundCheckRequired && submission.backgroundCheckStatus ? (
            <BackgroundCheckNotice status={submission.backgroundCheckStatus} />
          ) : null}
        </div>
      </PortalSection>

      <PortalSection
        id="answers"
        title="What was submitted"
        description="Read-only — this application has already been sent."
      >
        <div className="space-y-5">
          {orderedSections(form).map((s) => (
            <div key={s.id}>
              <h3 className="text-sm font-bold">{s.title}</h3>
              <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                {visibleQuestions(form, s.id, answers).map((question) => (
                  <div key={question.id}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {question.label}
                    </dt>
                    <dd className="mt-0.5 text-sm">
                      {formatAnswerValue(question, answers.get(question.id))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </PortalSection>
    </div>
  );
}

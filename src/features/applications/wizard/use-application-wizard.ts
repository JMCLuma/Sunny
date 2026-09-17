import { useCallback, useMemo, useRef, useState } from "react";

import type { AnswerRow, ApplicationAnswer, Id } from "@/features/operations/domain";
import type { SubmissionDetail } from "@/features/operations/data";

import {
  buildInitialAnswers,
  rowsOf,
  toAnswerList,
  type AnswerMap,
  type AnswerValue,
} from "./answers";
import {
  isSectionComplete,
  missingRequiredQuestions,
  orderedSections,
  resumeSectionIndex,
} from "./completion";
import { visibleQuestions } from "./visibility";

/**
 * Wizard state.
 *
 * Held in the component rather than in the URL: a half-typed essay is not
 * something to put in a query string, and the step is not a place anyone
 * should be able to link someone else to mid-form. What *is* durable goes to
 * the repository on every step change, which is what makes resuming work.
 *
 * Saving is deliberately not debounced per keystroke. The demo's promise is
 * "your place is kept when you leave", and a save at each step boundary keeps
 * it while staying legible when someone watches the network tab in the room.
 */

export type SaveState = "idle" | "saving" | "saved" | "failed";

export interface ApplicationWizardOptions {
  readonly detail: SubmissionDetail;
  readonly onSave: (
    answers: readonly ApplicationAnswer[],
    completedSectionIds: readonly Id[],
  ) => Promise<unknown>;
  readonly onSubmit: () => Promise<unknown>;
}

export function useApplicationWizard({ detail, onSave, onSubmit }: ApplicationWizardOptions) {
  const { form, submission, profile, account } = detail;
  const sections = useMemo(() => orderedSections(form), [form]);

  const [answers, setAnswers] = useState<AnswerMap>(() =>
    buildInitialAnswers(form, submission, profile, account),
  );
  const [completedSectionIds, setCompletedSectionIds] = useState<ReadonlySet<Id>>(
    () => new Set(submission.completedSectionIds),
  );
  // A section finished in an earlier sitting was confirmed in that sitting;
  // re-asking on resume would read as the save having been lost.
  const [confirmedSectionIds, setConfirmedSectionIds] = useState<ReadonlySet<Id>>(
    () => new Set(submission.completedSectionIds),
  );
  const [stepIndex, setStepIndex] = useState(() =>
    resumeSectionIndex(form, submission.completedSectionIds),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);

  // Only the most recent save may report its result: a fast step-through
  // otherwise lets an earlier response overwrite a later one's indicator.
  const saveToken = useRef(0);

  const section = sections[stepIndex] ?? sections[0];
  const sectionId = section?.id ?? "";

  const questions = useMemo(
    () => (section ? visibleQuestions(form, section.id, answers) : []),
    [form, section, answers],
  );

  const missing = useMemo(
    () => (section ? missingRequiredQuestions({ form, sectionId: section.id, answers }) : []),
    [form, section, answers],
  );

  const sectionComplete = useMemo(
    () =>
      section
        ? isSectionComplete({ form, sectionId: section.id, answers, confirmedSectionIds })
        : false,
    [form, section, answers, confirmedSectionIds],
  );

  const save = useCallback(
    async (nextAnswers: AnswerMap, nextCompleted: ReadonlySet<Id>) => {
      const token = ++saveToken.current;
      setSaveState("saving");
      try {
        await onSave(toAnswerList(form, nextAnswers), [...nextCompleted]);
        if (saveToken.current === token) setSaveState("saved");
      } catch {
        if (saveToken.current === token) setSaveState("failed");
      }
    },
    [form, onSave],
  );

  const setAnswer = useCallback((questionId: Id, value: AnswerValue, fileName?: string) => {
    setAnswers((current) => {
      const next = new Map(current);
      const answer: ApplicationAnswer = fileName
        ? { questionId, value, fileName }
        : { questionId, value };
      next.set(questionId, answer);
      return next;
    });
    setSaveState("idle");
  }, []);

  const setRows = useCallback(
    (questionId: Id, rows: readonly AnswerRow[]) => {
      setAnswer(questionId, rows);
    },
    [setAnswer],
  );

  const addRow = useCallback((questionId: Id) => {
    setAnswers((current) => {
      const next = new Map(current);
      const rows = rowsOf(current.get(questionId)?.value);
      next.set(questionId, { questionId, value: [...rows, {}] });
      return next;
    });
    setSaveState("idle");
  }, []);

  const confirmPrefill = useCallback(
    (confirmed: boolean) => {
      setConfirmedSectionIds((current) => {
        const next = new Set(current);
        if (confirmed) next.add(sectionId);
        else next.delete(sectionId);
        return next;
      });
    },
    [sectionId],
  );

  /** Jump to any step. Saves what is typed, and judges nothing. */
  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= sections.length) return;
      setShowErrors(false);
      setStepIndex(index);
      void save(answers, completedSectionIds);
    },
    [answers, completedSectionIds, save, sections.length],
  );

  /**
   * Continue: the only place a section is marked complete, and the only place
   * required answers are enforced. Moving backwards or sideways never refuses.
   */
  const continueStep = useCallback(() => {
    if (!section) return;
    if (!sectionComplete) {
      setShowErrors(true);
      return;
    }

    const nextCompleted = new Set(completedSectionIds);
    nextCompleted.add(section.id);
    setCompletedSectionIds(nextCompleted);
    setShowErrors(false);
    if (stepIndex < sections.length - 1) setStepIndex(stepIndex + 1);
    void save(answers, nextCompleted);
  }, [answers, completedSectionIds, save, section, sectionComplete, sections.length, stepIndex]);

  const submit = useCallback(async () => {
    if (!section) return;
    if (!sectionComplete) {
      setShowErrors(true);
      return;
    }

    const nextCompleted = new Set(completedSectionIds);
    nextCompleted.add(section.id);
    setCompletedSectionIds(nextCompleted);
    setSubmitting(true);
    try {
      await save(answers, nextCompleted);
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  }, [answers, completedSectionIds, onSubmit, save, section, sectionComplete]);

  return {
    sections,
    section,
    stepIndex,
    questions,
    answers,
    completedSectionIds,
    confirmedSectionIds,
    prefillConfirmed: confirmedSectionIds.has(sectionId),
    missing,
    sectionComplete,
    showErrors,
    saveState,
    submitting,
    isLastStep: stepIndex === sections.length - 1,
    setAnswer,
    setRows,
    addRow,
    confirmPrefill,
    goToStep,
    continueStep,
    submit,
  };
}

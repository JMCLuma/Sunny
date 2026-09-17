import type { ApplicationForm, ApplicationQuestion, Id } from "@/features/operations/domain";

import { isAnswered, prefilledQuestions, type AnswerMap } from "./answers";
import { visibleQuestions } from "./visibility";

/**
 * What "done" means for a section, and what the progress bar reads from.
 *
 * Two rules, and the second is the one that carries the design:
 *
 * 1. Every required question the section is currently *showing* is answered.
 *    A question hidden by `visibleWhen` was never asked, so it cannot hold the
 *    applicant up.
 * 2. Where the section pre-filled anything, the applicant has said the
 *    pre-filled values are right. Confirmation is the point of pre-filling —
 *    arriving with a stale address already ticked is worse than asking.
 *
 * Confirmation is one act per section rather than one per field. Eight
 * checkboxes to agree with eight things the family already told us is exactly
 * the length the call asked us to cut.
 */

export interface SectionCompletionInput {
  readonly form: ApplicationForm;
  readonly sectionId: Id;
  readonly answers: AnswerMap;
  /** Sections whose pre-filled values the applicant has confirmed. */
  readonly confirmedSectionIds: ReadonlySet<Id>;
}

/** Required, visible and still empty — the reason a Continue was refused. */
export function missingRequiredQuestions({
  form,
  sectionId,
  answers,
}: Omit<SectionCompletionInput, "confirmedSectionIds">): readonly ApplicationQuestion[] {
  return visibleQuestions(form, sectionId, answers).filter(
    (question) => question.required && !isAnswered(question, answers.get(question.id)?.value),
  );
}

/** True when the section pre-fills anything, and so has something to confirm. */
export function needsPrefillConfirmation(form: ApplicationForm, sectionId: Id): boolean {
  return prefilledQuestions(form, sectionId).length > 0;
}

export function isSectionComplete(input: SectionCompletionInput): boolean {
  const { form, sectionId, confirmedSectionIds } = input;
  if (missingRequiredQuestions(input).length > 0) return false;
  if (needsPrefillConfirmation(form, sectionId) && !confirmedSectionIds.has(sectionId))
    return false;
  return true;
}

/** Sections in the order they are stepped through. */
export function orderedSections(form: ApplicationForm) {
  return [...form.sections].sort((a, b) => a.order - b.order);
}

/**
 * 0–1 across the whole form, by completed sections.
 *
 * The same measure the repository reports for the applications list, so the
 * bar inside the wizard and the bar on the list card can never disagree.
 */
export function completionRatio(form: ApplicationForm, completedSectionIds: readonly Id[]): number {
  if (form.sections.length === 0) return 0;
  const known = new Set(form.sections.map((section) => section.id));
  const counted = new Set(completedSectionIds.filter((id) => known.has(id)));
  return counted.size / known.size;
}

/**
 * Where a returning applicant lands.
 *
 * The first section they have not finished — which for the seeded half-done
 * draft is the second step, not the first. Resuming onto a screen already
 * filled in reads as "nothing was saved", and is the single most common
 * complaint about a long form.
 */
export function resumeSectionIndex(
  form: ApplicationForm,
  completedSectionIds: readonly Id[],
): number {
  const sections = orderedSections(form);
  const completed = new Set(completedSectionIds);
  const next = sections.findIndex((section) => !completed.has(section.id));
  return next === -1 ? Math.max(sections.length - 1, 0) : next;
}

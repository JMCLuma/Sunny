import type { ApplicationForm, ApplicationQuestion, Id } from "@/features/operations/domain";

import { answerToStrings, questionsInSection, type AnswerMap } from "./answers";

/**
 * Conditional questions.
 *
 * `visibleWhen` is how the form stays short for the people it can stay short
 * for: "which camps?" is nine questions' worth of rows that only a returning
 * applicant ever sees. A hidden question is not merely unpainted — it is not
 * required, not counted towards the section, and not saved as an answer the
 * applicant never gave.
 */

/**
 * A condition is only met when the question it points at is *itself* visible.
 *
 * Otherwise hiding a parent would strand its children on stale answers: turn
 * "have they attended before" back to no and the rows behind it must go with
 * it, however the form is later rearranged.
 */
export function isQuestionVisible(
  question: ApplicationQuestion,
  form: ApplicationForm,
  answers: AnswerMap,
  seen: ReadonlySet<Id> = new Set(),
): boolean {
  const condition = question.visibleWhen;
  if (!condition) return true;

  // A form that referenced itself in a cycle would otherwise recurse forever.
  // Treat the cycle as unsatisfiable rather than crashing an applicant's page.
  if (seen.has(question.id)) return false;

  const controller = form.questions.find((entry) => entry.id === condition.questionId);
  if (!controller) return false;
  if (!isQuestionVisible(controller, form, answers, new Set([...seen, question.id]))) return false;

  const held = answerToStrings(answers.get(controller.id)?.value);
  return condition.equalsAnyOf.some((candidate) => held.includes(candidate));
}

/** The questions a section is actually asking right now, in order. */
export function visibleQuestions(
  form: ApplicationForm,
  sectionId: Id,
  answers: AnswerMap,
): readonly ApplicationQuestion[] {
  return questionsInSection(form, sectionId).filter((question) =>
    isQuestionVisible(question, form, answers),
  );
}

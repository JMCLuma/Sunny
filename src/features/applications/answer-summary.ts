import type { ApplicationAnswer, ApplicationQuestion } from "@/features/operations/domain";

/**
 * Read-only display of a submitted answer.
 *
 * Split from `QuestionField` on purpose: once an application is sent there is
 * nothing left to edit, and reusing the input controls just to disable them
 * would carry all their state and none of their point. This turns the same
 * stored value into the sentence a family reads back, coded values included —
 * a Jamatkhana or grade the applicant chose from a list should read back as
 * the label they picked, not the code it is stored as.
 */
export function formatAnswerValue(
  question: ApplicationQuestion,
  answer: ApplicationAnswer | undefined,
): string {
  if (question.type === "file_upload") return answer?.fileName ?? "No file attached";

  const value = answer?.value ?? null;
  if (value === null || value === undefined) return "Not answered";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    if (value.length === 0) return "Not answered";
    if (question.type === "repeatable_group") {
      return `${value.length} ${value.length === 1 ? "entry" : "entries"}`;
    }
    const options = question.options ?? [];
    return value
      .map((entry) =>
        typeof entry === "string"
          ? (options.find((option) => option.value === entry)?.label ?? entry)
          : String(entry),
      )
      .join(", ");
  }

  const options = question.options ?? [];
  if (options.length > 0) {
    return options.find((option) => option.value === String(value))?.label ?? String(value);
  }
  return String(value);
}

import type {
  Account,
  AnswerRow,
  ApplicationAnswer,
  ApplicationForm,
  ApplicationQuestion,
  ApplicationSubmission,
  Id,
  Profile,
  PrefillSource,
  QuestionOption,
} from "@/features/operations/domain";

/**
 * Answers, and where a pre-filled one comes from.
 *
 * `prefillFrom` is the mechanism behind the call's loudest piece of feedback —
 * confirm, don't retype. Resolving it is the whole of that feature: a question
 * carrying a source arrives holding the household's own value, and the
 * applicant's job is to agree with it rather than to type their own last name
 * for the fourth time.
 *
 * Kept pure and away from React so the rules can be tested directly: what a
 * source resolves to, how a stored value coerces onto a question, and which
 * answers a half-finished draft already holds.
 */

export type AnswerValue = ApplicationAnswer["value"];

/** Answers keyed by question, which is how the wizard holds and updates them. */
export type AnswerMap = ReadonlyMap<Id, ApplicationAnswer>;

export function toAnswerMap(answers: readonly ApplicationAnswer[]): AnswerMap {
  return new Map(answers.map((answer) => [answer.questionId, answer]));
}

/**
 * Back to the contract's shape, ordered by the form rather than by the order
 * fields happened to be touched — a save that reshuffles its own payload makes
 * every diff in Operations unreadable.
 */
export function toAnswerList(
  form: ApplicationForm,
  answers: AnswerMap,
): readonly ApplicationAnswer[] {
  const list: ApplicationAnswer[] = [];
  for (const question of orderedQuestions(form)) {
    const answer = answers.get(question.id);
    if (answer) list.push(answer);
  }
  return list;
}

/** Every question of a form in section order, then question order. */
export function orderedQuestions(form: ApplicationForm): readonly ApplicationQuestion[] {
  const sectionOrder = new Map(form.sections.map((section) => [section.id, section.order]));
  return [...form.questions].sort((a, b) => {
    const sectionDelta =
      (sectionOrder.get(a.sectionId) ?? 0) - (sectionOrder.get(b.sectionId) ?? 0);
    return sectionDelta !== 0 ? sectionDelta : a.order - b.order;
  });
}

export function questionsInSection(
  form: ApplicationForm,
  sectionId: Id,
): readonly ApplicationQuestion[] {
  return form.questions
    .filter((question) => question.sectionId === sectionId)
    .sort((a, b) => a.order - b.order);
}

/** The raw household value behind a source, before it is fitted to a question. */
function readSource(source: PrefillSource, profile: Profile, account: Account): AnswerValue {
  switch (source) {
    case "profile.legalFirstName":
      return profile.legalFirstName;
    case "profile.legalLastName":
      return profile.legalLastName;
    case "profile.preferredName":
      return profile.preferredName;
    case "profile.dateOfBirth":
      return profile.dateOfBirth;
    case "profile.risingSecularGrade":
      return profile.risingSecularGrade;
    case "profile.risingRecGrade":
      return profile.risingRecGrade;
    case "profile.schoolName":
      return profile.schoolName;
    case "profile.schoolType":
      return profile.schoolType;
    case "profile.languages":
      return profile.languages.map((entry) => entry.language);
    case "profile.needsTranslator":
      return profile.needsTranslator;
    case "account.email":
      return account.email;
    case "account.phone":
      return account.phone;
    case "account.city":
      return account.city;
    case "account.state":
      return account.state;
    case "account.postalCode":
      return account.postalCode;
    case "account.regionId":
      return account.regionId;
    case "account.jamatkhana":
      return account.jamatkhana;
  }
}

/**
 * Match a stored value to an option.
 *
 * Profiles hold display text — a Jamatkhana is stored on the account as the
 * name a person would say out loud, and a language as "English". The form's
 * options are coded values. So a prefill matches on either side, and anything
 * that matches neither is dropped rather than injected as a value the select
 * cannot show.
 */
function matchOption(options: readonly QuestionOption[], raw: string): QuestionOption | null {
  const needle = raw.trim().toLowerCase();
  return (
    options.find((option) => option.value.toLowerCase() === needle) ??
    options.find((option) => option.label.toLowerCase() === needle) ??
    null
  );
}

/** Fit a household value to the question asking for it, or refuse to guess. */
export function coerceToQuestion(question: ApplicationQuestion, raw: AnswerValue): AnswerValue {
  if (raw === null || raw === undefined) return null;

  const options = question.options;
  if (options && options.length > 0) {
    const candidates = (Array.isArray(raw) ? raw : [raw])
      .map((entry) => (typeof entry === "object" ? null : matchOption(options, String(entry))))
      .filter((option): option is QuestionOption => option !== null)
      .map((option) => option.value);

    if (question.type === "multi_select") return candidates;
    return candidates[0] ?? null;
  }

  switch (question.type) {
    case "number": {
      const value = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(value) ? value : null;
    }
    case "boolean":
      return typeof raw === "boolean" ? raw : null;
    default:
      return typeof raw === "string" || typeof raw === "number" ? raw : null;
  }
}

/** What a question arrives pre-filled with, or `null` when it is asked cold. */
export function resolvePrefill(
  question: ApplicationQuestion,
  profile: Profile,
  account: Account,
): AnswerValue {
  if (!question.prefillFrom) return null;
  return coerceToQuestion(question, readSource(question.prefillFrom, profile, account));
}

/** Questions in a section that the household already answers for the applicant. */
export function prefilledQuestions(
  form: ApplicationForm,
  sectionId: Id,
): readonly ApplicationQuestion[] {
  return questionsInSection(form, sectionId).filter((question) => question.prefillFrom);
}

/**
 * The answers the wizard opens with.
 *
 * A saved answer always wins: a draft that has been edited must come back
 * exactly as it was left, even where the applicant deliberately corrected
 * something the profile still disagrees with. Prefill only fills the gaps.
 */
export function buildInitialAnswers(
  form: ApplicationForm,
  submission: ApplicationSubmission,
  profile: Profile,
  account: Account,
): AnswerMap {
  const answers = new Map(toAnswerMap(submission.answers));

  for (const question of form.questions) {
    if (answers.has(question.id)) continue;
    const value = resolvePrefill(question, profile, account);
    if (value === null) continue;
    answers.set(question.id, { questionId: question.id, value });
  }

  return answers;
}

/** True when a question's stored answer is the value the profile supplied. */
export function isUntouchedPrefill(
  question: ApplicationQuestion,
  answers: AnswerMap,
  profile: Profile,
  account: Account,
): boolean {
  if (!question.prefillFrom) return false;
  const current = answers.get(question.id)?.value ?? null;
  const prefilled = resolvePrefill(question, profile, account);
  return sameValue(current, prefilled);
}

function sameValue(a: AnswerValue, b: AnswerValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((entry, index) => entry === b[index]);
  }
  return a === b;
}

/**
 * A value flattened to strings, which is the only comparison `visibleWhen`
 * needs: a boolean "yes" reads as `"true"`, a grade as `"7"`, a multi-select as
 * each of its chosen values.
 */
export function answerToStrings(value: AnswerValue | undefined): readonly string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "object") return [];
  return [String(value)];
}

/** Rows of a repeatable group, tolerating a question that has never been filled. */
export function rowsOf(value: AnswerValue | undefined): readonly AnswerRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is AnswerRow => typeof entry === "object" && entry !== null);
}

/**
 * Whether another row may be added.
 *
 * The cap is in the data because the call put it there: one applicant entering
 * five hundred prior camps is a support ticket, not a feature.
 */
export function canAddEntry(question: ApplicationQuestion, rows: readonly AnswerRow[]): boolean {
  return rows.length < (question.maxEntries ?? Number.POSITIVE_INFINITY);
}

/** Whether a question holds something worth saving. */
export function isAnswered(question: ApplicationQuestion, value: AnswerValue | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;

  if (question.type === "repeatable_group") {
    const rows = rowsOf(value);
    return rows.length > 0 && rows.every((row) => isRowComplete(question, row));
  }
  return value.length > 0;
}

/** Every required sub-question of a repeatable row carries a value. */
export function isRowComplete(question: ApplicationQuestion, row: AnswerRow): boolean {
  return (question.subQuestions ?? [])
    .filter((sub) => sub.required)
    .every((sub) => isAnswered(sub, row[sub.id] ?? null));
}

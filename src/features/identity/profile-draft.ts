import type { ProfileDraft } from "@/features/operations/data";
import type { LanguageProficiency, Profile, SchoolType } from "@/features/operations/domain";
import { formatGrade } from "@/features/operations/domain";

/**
 * The profile form's shape, its options and its rules.
 *
 * Everything on a profile is here for one of two reasons, and a parent being
 * asked should be able to tell which: a field either decides eligibility, or
 * it is read afterwards by the people running the camp. `FIELD_PURPOSE` below
 * is what the detail screen prints next to each one. It is not decoration —
 * "why are you asking my child's school?" is a real support email, and the
 * answer (equity reach across camps) is a good one that nobody ever hears.
 */

export const SCHOOL_TYPES: readonly { value: SchoolType; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "charter", label: "Charter" },
  { value: "parochial", label: "Parochial" },
  { value: "home", label: "Home school" },
  { value: "other", label: "Other" },
];

export const LANGUAGES: readonly string[] = [
  "English",
  "Gujarati",
  "Urdu",
  "Farsi",
  "Arabic",
  "French",
  "Portuguese",
  "Russian",
  "Tajik",
];

/** 0 is kindergarten, which `formatGrade` already knows how to say. */
export const GRADES: readonly number[] = Array.from({ length: 13 }, (_, index) => index);

export function gradeLabel(grade: number | null): string {
  return grade === null ? "Not recorded" : formatGrade(grade);
}

export type ProfileField =
  | "dateOfBirth"
  | "risingSecularGrade"
  | "risingRecGrade"
  | "school"
  | "languages"
  | "needsTranslator";

export interface FieldPurpose {
  readonly label: string;
  /** Why it is asked, in the words a parent would use. */
  readonly why: string;
  /** True when a camp's admission rules are evaluated against it. */
  readonly decidesEligibility: boolean;
}

export const FIELD_PURPOSE: Readonly<Record<ProfileField, FieldPurpose>> = {
  dateOfBirth: {
    label: "Date of birth",
    why: "Some camps admit by age on a fixed date rather than by grade, so this decides which of those they can apply to. The date is pinned to the camp's start, so a birthday during the cycle cannot change the answer halfway through.",
    decidesEligibility: true,
  },
  risingSecularGrade: {
    label: "Rising school grade",
    why: "The grade they will be in this coming school year — not the one they just finished. Camps like Embark admit by rising grade, so this is the field that decides eligibility for them.",
    decidesEligibility: true,
  },
  risingRecGrade: {
    label: "Rising REC grade",
    why: "Religious education grade in the coming year. A few camps admit on this instead of school grade, which is why it is asked separately rather than assumed to match.",
    decidesEligibility: true,
  },
  school: {
    label: "School and school type",
    why: "Not used to decide anything. It is read across all camps together to see who the programs are actually reaching, which is a stated equity goal. Street address used to be collected alongside it and was dropped, because nothing read it.",
    decidesEligibility: false,
  },
  languages: {
    label: "Languages",
    why: "Used when staffing a camp, so that a participant who is more comfortable in Farsi or Gujarati has someone to speak to.",
    decidesEligibility: false,
  },
  needsTranslator: {
    label: "Translation support",
    why: "Tells the camp to arrange support in advance rather than discovering the need on arrival.",
    decidesEligibility: false,
  },
};

/** An empty draft. Separate from the form so a reset is one assignment. */
export function emptyProfileDraft(): ProfileDraft {
  return {
    legalFirstName: "",
    legalLastName: "",
    preferredName: null,
    dateOfBirth: null,
    risingSecularGrade: null,
    risingRecGrade: null,
    schoolName: null,
    schoolType: null,
    languages: [],
    needsTranslator: false,
  };
}

/** The current values of an existing profile, ready to edit. */
export function profileToDraft(profile: Profile): ProfileDraft {
  return {
    legalFirstName: profile.legalFirstName,
    legalLastName: profile.legalLastName,
    preferredName: profile.preferredName,
    dateOfBirth: profile.dateOfBirth,
    risingSecularGrade: profile.risingSecularGrade,
    risingRecGrade: profile.risingRecGrade,
    schoolName: profile.schoolName,
    schoolType: profile.schoolType,
    languages: profile.languages,
    needsTranslator: profile.needsTranslator,
  };
}

export interface DraftValidation {
  /** Field-keyed messages that block saving. */
  readonly errors: Readonly<Record<string, string>>;
  /**
   * Things a family may legitimately leave blank, with the consequence
   * spelled out. A form that refuses to save without a REC grade excludes
   * every household that does not have one; a form that saves and then shows
   * no camps is just as bad. Saying which camps go missing is the third option.
   */
  readonly warnings: readonly string[];
  readonly valid: boolean;
}

export function validateProfileDraft(draft: ProfileDraft): DraftValidation {
  const errors: Record<string, string> = {};
  if (draft.legalFirstName.trim().length === 0) {
    errors["legalFirstName"] = "A legal first name is required — it has to match their documents.";
  }
  if (draft.legalLastName.trim().length === 0) {
    errors["legalLastName"] = "A legal last name is required.";
  }
  if (draft.dateOfBirth !== null && !/^\d{4}-\d{2}-\d{2}$/.test(draft.dateOfBirth)) {
    errors["dateOfBirth"] = "Use a full date, for example 2011-08-03.";
  }

  const warnings: string[] = [];
  if (draft.dateOfBirth === null) {
    warnings.push("Without a date of birth, camps that admit by age cannot be offered.");
  }
  if (draft.risingSecularGrade === null) {
    warnings.push("Without a rising school grade, camps that admit by grade cannot be offered.");
  }
  if (draft.schoolName !== null && draft.schoolType === null) {
    warnings.push("A school type makes the reach reporting usable; the name alone does not.");
  }

  return { errors, warnings, valid: Object.keys(errors).length === 0 };
}

/** Toggling one language in the list, kept pure so the form stays trivial. */
export function toggleLanguage(
  languages: readonly LanguageProficiency[],
  language: string,
): readonly LanguageProficiency[] {
  const present = languages.some((entry) => entry.language === language);
  if (present) return languages.filter((entry) => entry.language !== language);
  // Level is refined on the application itself; the profile only needs to know
  // the language is spoken at all.
  return [...languages, { language, level: "conversational" }];
}

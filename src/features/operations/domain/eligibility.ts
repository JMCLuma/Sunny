import type { Id, IsoDate } from "./common";
import type { RegionId } from "./region";

/**
 * Who may apply to a given program instance, and how that is decided.
 *
 * ## Why this is a rule *set* and not three columns
 *
 * Camps do not express eligibility the same way and never have. Embark admits
 * by rising secular grade, Al-Ummah by age, Mosaic by a mix, and staff roles
 * differ again — a Mosaic guide can start at fourteen while an Al-Ummah PA
 * starts at nineteen. The 09-09 call landed on the resolution: let each camp
 * state its own criteria, and let a criterion be "either/or".
 *
 * So `EligibilityCriteria` holds a list of `EligibilityRule`s and an applicant
 * matching **any** of them qualifies. "Fifteen to seventeen, or rising
 * sophomore through rising senior" is two rules, not a special case.
 *
 * This is the piece that makes the universal application universal: the
 * applicant picks a profile and is offered only the camps that profile can
 * actually attend, instead of a list of thirty they must filter themselves —
 * which is what produces eight speculative Mosaic applications from one family.
 */

/** 0 is kindergarten; 1–12 are the named grades. */
export type GradeLevel = number;

export type EligibilityRule =
  | {
      readonly kind: "age";
      readonly minAge: number;
      readonly maxAge: number;
      /**
       * The date age is measured at — usually the instance start.
       * Pinned so a birthday during the cycle cannot change the answer
       * halfway through a selection round.
       */
      readonly asOf: IsoDate;
    }
  | {
      readonly kind: "secular_grade";
      readonly minGrade: GradeLevel;
      readonly maxGrade: GradeLevel;
    }
  | {
      readonly kind: "rec_grade";
      readonly minGrade: GradeLevel;
      readonly maxGrade: GradeLevel;
    };

export type EligibilityAudience = "participant" | "staff";

export interface EligibilityCriteria {
  readonly id: Id;
  readonly programId: Id;
  readonly programInstanceId: Id;
  readonly audience: EligibilityAudience;
  /** Matching any one rule qualifies. An empty list means "open to all". */
  readonly rules: readonly EligibilityRule[];
  /** `null` means no regional restriction. */
  readonly regionIds: readonly RegionId[] | null;
  /** Embark and others admit first-time attendees only. */
  readonly firstTimeOnly: boolean;
  readonly note: string | null;
}

/** The applicant facts eligibility is decided on. Nothing else is consulted. */
export interface EligibilitySubject {
  readonly dateOfBirth: IsoDate | null;
  readonly risingSecularGrade: GradeLevel | null;
  readonly risingRecGrade: GradeLevel | null;
  readonly regionId: RegionId | null;
  readonly hasAttendedBefore: boolean;
}

export type EligibilityVerdict = "eligible" | "not_eligible" | "unknown";

/**
 * Why an answer came out the way it did.
 *
 * Carried so the UI can say "not eligible — this camp is for rising grades
 * 7–9" rather than silently omitting a camp a family expected to see. A camp
 * that vanishes with no explanation generates a support email; one that
 * explains itself does not.
 */
export interface EligibilityReason {
  readonly code:
    | "age_out_of_range"
    | "grade_out_of_range"
    | "region_restricted"
    | "first_time_only"
    | "missing_date_of_birth"
    | "missing_grade"
    | "matched_rule"
    | "open_to_all";
  readonly detail: string;
}

export interface EligibilityResult {
  readonly verdict: EligibilityVerdict;
  readonly reasons: readonly EligibilityReason[];
}

const GRADE_LABELS: Readonly<Record<number, string>> = { 0: "Kindergarten" };

/** "Kindergarten", "7th grade" — used in criteria summaries and denial text. */
export function formatGrade(grade: GradeLevel): string {
  const named = GRADE_LABELS[grade];
  if (named) return named;
  const suffix =
    grade % 100 >= 11 && grade % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][grade % 10] ?? "th");
  return `${grade}${suffix} grade`;
}

/** Whole years old at `asOf`. Returns null when the date of birth is unknown. */
export function ageAt(dateOfBirth: IsoDate | null, asOf: IsoDate): number | null {
  if (!dateOfBirth) return null;
  const born = new Date(`${dateOfBirth}T00:00:00Z`);
  const at = new Date(`${asOf}T00:00:00Z`);
  if (Number.isNaN(born.getTime()) || Number.isNaN(at.getTime())) return null;

  let age = at.getUTCFullYear() - born.getUTCFullYear();
  const monthDelta = at.getUTCMonth() - born.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && at.getUTCDate() < born.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/** Plain-language summary of a rule, for the criteria editor and camp pages. */
export function describeRule(rule: EligibilityRule): string {
  switch (rule.kind) {
    case "age":
      return `Ages ${rule.minAge}–${rule.maxAge}`;
    case "secular_grade":
      return `Rising ${formatGrade(rule.minGrade)}–${formatGrade(rule.maxGrade)}`;
    case "rec_grade":
      return `REC ${formatGrade(rule.minGrade)}–${formatGrade(rule.maxGrade)}`;
  }
}

function evaluateRule(rule: EligibilityRule, subject: EligibilitySubject): EligibilityResult {
  switch (rule.kind) {
    case "age": {
      const age = ageAt(subject.dateOfBirth, rule.asOf);
      if (age === null) {
        return {
          verdict: "unknown",
          reasons: [
            { code: "missing_date_of_birth", detail: "Add a date of birth to check this camp." },
          ],
        };
      }
      return age >= rule.minAge && age <= rule.maxAge
        ? { verdict: "eligible", reasons: [{ code: "matched_rule", detail: describeRule(rule) }] }
        : {
            verdict: "not_eligible",
            reasons: [
              {
                code: "age_out_of_range",
                detail: `This camp is for ages ${rule.minAge}–${rule.maxAge}.`,
              },
            ],
          };
    }
    case "secular_grade":
    case "rec_grade": {
      const grade =
        rule.kind === "secular_grade" ? subject.risingSecularGrade : subject.risingRecGrade;
      const label = rule.kind === "secular_grade" ? "school grade" : "REC grade";
      if (grade === null) {
        return {
          verdict: "unknown",
          reasons: [{ code: "missing_grade", detail: `Add a rising ${label} to check this camp.` }],
        };
      }
      return grade >= rule.minGrade && grade <= rule.maxGrade
        ? { verdict: "eligible", reasons: [{ code: "matched_rule", detail: describeRule(rule) }] }
        : {
            verdict: "not_eligible",
            reasons: [
              { code: "grade_out_of_range", detail: `This camp is for ${describeRule(rule)}.` },
            ],
          };
    }
  }
}

/**
 * Decide whether one applicant may apply to one instance.
 *
 * Order matters and is deliberate. Region and first-timer act as gates: they
 * are facts about the applicant that no rule can override, so they are checked
 * first and refuse outright. Only then are the age/grade rules tried, and
 * matching any one of them qualifies.
 *
 * `unknown` is a real answer, not a failure. A family who has not filled in a
 * date of birth yet should be told what is missing, not quietly refused.
 */
export function evaluateEligibility(
  criteria: EligibilityCriteria,
  subject: EligibilitySubject,
): EligibilityResult {
  if (criteria.regionIds && criteria.regionIds.length > 0) {
    if (!subject.regionId || !criteria.regionIds.includes(subject.regionId)) {
      return {
        verdict: "not_eligible",
        reasons: [
          { code: "region_restricted", detail: "This camp is open to specific regions only." },
        ],
      };
    }
  }

  if (criteria.firstTimeOnly && subject.hasAttendedBefore) {
    return {
      verdict: "not_eligible",
      reasons: [{ code: "first_time_only", detail: "This camp is for first-time attendees." }],
    };
  }

  if (criteria.rules.length === 0) {
    return { verdict: "eligible", reasons: [{ code: "open_to_all", detail: "Open to all ages." }] };
  }

  const results = criteria.rules.map((rule) => evaluateRule(rule, subject));

  const matched = results.find((result) => result.verdict === "eligible");
  if (matched) return matched;

  // Nothing matched, but something could not be judged: ask for the missing
  // fact rather than refusing on incomplete information.
  const unknown = results.filter((result) => result.verdict === "unknown");
  if (unknown.length > 0) {
    return { verdict: "unknown", reasons: unknown.flatMap((result) => result.reasons) };
  }

  return {
    verdict: "not_eligible",
    reasons: results.flatMap((result) => result.reasons),
  };
}

/** One line covering every rule, e.g. "Ages 15–17 or Rising 10th–12th grade". */
export function describeCriteria(criteria: EligibilityCriteria): string {
  if (criteria.rules.length === 0) return "Open to all ages";
  return criteria.rules.map(describeRule).join(" or ");
}

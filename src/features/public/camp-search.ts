import type { EligibilitySubject, GradeLevel, IsoDate } from "@/features/operations/domain";

import type { CampInterest } from "./camp-catalogue";

/**
 * The Find My Camp filters, held in the URL.
 *
 * In the URL rather than in component state for two reasons: a family can send
 * "here are the camps for a 13-year-old in the Southwest" to their spouse, and
 * a presenter can open the demo already filtered.
 *
 * Nobody is signed in here, so there is no profile to check against. The
 * visitor's own answers become an `EligibilitySubject` and go through the same
 * evaluator the signed-in path uses — being told one thing before registering
 * and another after would be worse than showing nothing.
 */

export interface CampSearch {
  readonly age: number | null;
  readonly grade: GradeLevel | null;
  readonly regionId: string | null;
  readonly interest: CampInterest | null;
}

const INTERESTS: readonly string[] = [
  "leadership",
  "faith",
  "outdoors",
  "service",
  "sports",
  "academics",
];

function toBoundedInt(value: unknown, min: number, max: number): number | null {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return null;
  // Clamp rather than reject: a hand-edited URL should narrow the list, never
  // break the page.
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export function parseCampSearch(input: Record<string, unknown>): CampSearch {
  const interest = String(input["interest"] ?? "");
  const regionId = String(input["region"] ?? "");

  return {
    age: toBoundedInt(input["age"], 4, 30),
    grade: toBoundedInt(input["grade"], 0, 12),
    regionId: regionId.startsWith("org_") ? regionId : null,
    interest: INTERESTS.includes(interest) ? (interest as CampInterest) : null,
  };
}

/** Every filter cleared — the shape a link to an unfiltered /camps needs. */
export const DEFAULT_CAMP_SEARCH: CampSearch = {
  age: null,
  grade: null,
  regionId: null,
  interest: null,
};

export function hasActiveCampFilters(search: CampSearch): boolean {
  return (
    search.age !== null ||
    search.grade !== null ||
    search.regionId !== null ||
    search.interest !== null
  );
}

/**
 * Turn what the visitor told us into something the eligibility engine accepts.
 *
 * `hasAttendedBefore` is false because an anonymous visitor has no history we
 * can see. That is the generous reading: a first-timer-only camp stays visible
 * to someone who may in fact have attended, and the camp page says so, rather
 * than hiding a camp from a family who would have qualified.
 */
export function toEligibilitySubject(search: CampSearch, today: IsoDate): EligibilitySubject {
  return {
    dateOfBirth: search.age === null ? null : approximateBirthDate(search.age, today),
    risingSecularGrade: search.grade,
    risingRecGrade: search.grade,
    regionId: search.regionId,
    hasAttendedBefore: false,
  };
}

/**
 * A birth date that yields exactly the stated age today.
 *
 * The engine measures age from a date of birth, and a visitor only gives us a
 * number. Anchoring to today's month and day means the derived age is right on
 * the day they ask, which is all a browsing filter needs to be.
 */
function approximateBirthDate(age: number, today: IsoDate): IsoDate {
  const [year, month, day] = today.split("-");
  return `${Number(year) - age}-${month}-${day}`;
}

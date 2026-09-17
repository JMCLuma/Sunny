/**
 * URL search parameters for the identity routes.
 *
 * Hand-written for the same reason `program-filters.ts` is: these arrive as
 * untrusted strings, and anything unrecognised should degrade to the default
 * screen rather than throw. A stale link from an old verification email must
 * still land somewhere sensible.
 */

export type VerificationState = "pending" | "verified";

export interface VerifySearch {
  readonly state: VerificationState;
  readonly email?: string;
}

export function parseVerifySearch(input: Record<string, unknown>): VerifySearch {
  const state = input["state"] === "verified" ? "verified" : "pending";
  const raw = input["email"];
  // Bounded and only ever echoed back as text, never used to look anything up.
  const email =
    typeof raw === "string" && raw.trim().length > 0 ? raw.trim().slice(0, 254) : undefined;
  return { state, ...(email !== undefined ? { email } : {}) };
}

export interface OnboardingSearch {
  /** 1-based, so the URL reads the way the stepper does. */
  readonly step: number;
}

export const ONBOARDING_STEP_COUNT = 4;

export function parseOnboardingSearch(input: Record<string, unknown>): OnboardingSearch {
  const value = Number(input["step"]);
  if (!Number.isInteger(value) || value < 1 || value > ONBOARDING_STEP_COUNT) return { step: 1 };
  return { step: value };
}

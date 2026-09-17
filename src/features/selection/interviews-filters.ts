import type { InterviewStatus } from "@/features/operations/domain";

/**
 * URL search-parameter shape for the interviews screen.
 *
 * Same convention as `application-filters.ts`: an unrecognised value is
 * dropped rather than coerced, so a stale link degrades to the unfiltered
 * screen instead of erroring, and a session or status an actor cannot reach
 * still passes validation here — the route's access policy is what actually
 * narrows it.
 */

export const INTERVIEW_STATUSES: readonly InterviewStatus[] = [
  "unscheduled",
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
];

export const ANY_OPTION = "all";

export interface InterviewsSearch {
  readonly instance?: string;
  readonly status?: InterviewStatus;
}

function readString(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed.slice(0, 120);
}

function readStatus(input: Record<string, unknown>): InterviewStatus | undefined {
  const value = input["status"];
  return typeof value === "string" && (INTERVIEW_STATUSES as readonly string[]).includes(value)
    ? (value as InterviewStatus)
    : undefined;
}

export function parseInterviewsSearch(input: Record<string, unknown>): InterviewsSearch {
  const instance = readString(input, "instance");
  const status = readStatus(input);

  return {
    ...(instance !== undefined ? { instance } : {}),
    ...(status !== undefined ? { status } : {}),
  };
}

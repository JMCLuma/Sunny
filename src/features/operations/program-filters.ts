import type { ProgramEventType, ProgramInstanceStatus } from "./domain";

/**
 * URL search-parameter shapes for the Programs module.
 *
 * Filter state lives in the URL so a filtered view can be linked, bookmarked
 * and refreshed — which also means the values arrive as untrusted strings.
 * These parsers are hand-written rather than pulling in a schema library for
 * four fields: anything unrecognised is dropped, never coerced, so a hostile
 * or stale URL degrades to the unfiltered page instead of erroring.
 */

export const PROGRAM_INSTANCE_STATUSES: readonly ProgramInstanceStatus[] = [
  "planning",
  "applications_open",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

export const PROGRAM_EVENT_TYPES: readonly ProgramEventType[] = [
  "training",
  "orientation",
  "meeting",
  "staff_camp",
  "summit",
  "site_visit",
  "debrief",
  "other",
];

/** Sentinel used by the selects, since a native option cannot hold `undefined`. */
export const ANY_OPTION = "all";

export interface ProgramsSearch {
  readonly q?: string;
  readonly year?: number;
  readonly region?: string;
  readonly status?: ProgramInstanceStatus;
}

export interface EventsSearch {
  readonly q?: string;
  readonly program?: string;
  readonly year?: number;
  readonly type?: ProgramEventType;
  readonly region?: string;
}

function readString(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed.slice(0, 120);
}

function readYear(input: Record<string, unknown>, key: string): number | undefined {
  const value = input[key];
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  // A plausible operating cycle. Anything else is a typo or a probe.
  return parsed >= 2000 && parsed <= 2100 ? parsed : undefined;
}

function readOneOf<T extends string>(
  input: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = input[key];
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export function parseProgramsSearch(input: Record<string, unknown>): ProgramsSearch {
  const q = readString(input, "q");
  const year = readYear(input, "year");
  const region = readString(input, "region");
  const status = readOneOf(input, "status", PROGRAM_INSTANCE_STATUSES);

  // Keys are added only when present: an absent filter must not serialize as
  // `?q=` and must not trip `exactOptionalPropertyTypes`.
  return {
    ...(q !== undefined ? { q } : {}),
    ...(year !== undefined ? { year } : {}),
    ...(region !== undefined ? { region } : {}),
    ...(status !== undefined ? { status } : {}),
  };
}

export function parseEventsSearch(input: Record<string, unknown>): EventsSearch {
  const q = readString(input, "q");
  const program = readString(input, "program");
  const year = readYear(input, "year");
  const type = readOneOf(input, "type", PROGRAM_EVENT_TYPES);
  const region = readString(input, "region");

  return {
    ...(q !== undefined ? { q } : {}),
    ...(program !== undefined ? { program } : {}),
    ...(year !== undefined ? { year } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(region !== undefined ? { region } : {}),
  };
}

export function hasActiveProgramsFilters(search: ProgramsSearch): boolean {
  return Object.keys(search).length > 0;
}

export function hasActiveEventsFilters(search: EventsSearch): boolean {
  return Object.keys(search).length > 0;
}

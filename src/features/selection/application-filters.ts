import type { ApplicationStatus, EligibilityAudience } from "@/features/operations/domain";

/**
 * URL search-parameter shapes for Applications & selection.
 *
 * Same contract as `operations/program-filters.ts`, and for the same two
 * reasons: a presenter has to be able to link a filtered queue ("here are the
 * 12 waitlisted in the Northeast"), and values arriving from a URL are
 * untrusted strings. Anything unrecognised is dropped rather than coerced, so a
 * stale or hostile link degrades to the unfiltered screen instead of erroring.
 *
 * Parsing never widens access. A `region` or `instance` the actor cannot reach
 * still passes validation here — it is simply a filter value — and the route's
 * access policy then returns nothing for it.
 */

/** The sentinel the selects use, since an option cannot carry `undefined`. */
export const ANY_OPTION = "all";

/**
 * Statuses worth filtering a reviewer's queue by.
 *
 * `draft` is absent because the repository never returns an unsubmitted
 * application to Operations — a half-filled form is the family's business
 * until they send it.
 */
export const QUEUE_APPLICATION_STATUSES = [
  "submitted",
  "under_review",
  "interview_scheduled",
  "interviewed",
  "scored",
  "recommended",
  "accepted",
  "waitlisted",
  "rejected",
  "confirmed",
  "withdrawn",
  "background_check_cleared",
  "onboarded",
] as const satisfies readonly ApplicationStatus[];

export const APPLICATION_AUDIENCES = [
  "participant",
  "staff",
] as const satisfies readonly EligibilityAudience[];

/** How the selection board is ordered. Score first: it is why the board exists. */
export const SELECTION_SORT_KEYS = ["score", "name", "status", "region"] as const;
export type SelectionSortKey = (typeof SELECTION_SORT_KEYS)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface QueueSearch {
  readonly q?: string;
  readonly program?: string;
  readonly instance?: string;
  readonly region?: string;
  readonly audience?: EligibilityAudience;
  readonly status?: ApplicationStatus;
}

export interface ReviewSearch {
  readonly instance?: string;
  /** Absent means blind — see `isBlind`. */
  readonly identified?: boolean;
  /** The application open in the scoring panel. */
  readonly submission?: string;
}

export interface SelectionSearch {
  readonly instance?: string;
  readonly sort?: SelectionSortKey;
  readonly dir?: SortDirection;
  readonly status?: ApplicationStatus;
}

export interface SubmissionSearch {
  /** Carried from blind review so opening one application does not unmask it. */
  readonly identified?: boolean;
}

function readString(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed.slice(0, 120);
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

/**
 * Only an explicit `1` turns identification on.
 *
 * Deliberately asymmetric: the safe state is the default, and a malformed or
 * half-copied URL falls back to blind rather than to names on screen.
 */
function readIdentified(input: Record<string, unknown>): boolean | undefined {
  const value = input["identified"];
  if (value === true || value === 1 || value === "1") return true;
  return undefined;
}

export function parseQueueSearch(input: Record<string, unknown>): QueueSearch {
  const q = readString(input, "q");
  const program = readString(input, "program");
  const instance = readString(input, "instance");
  const region = readString(input, "region");
  const audience = readOneOf(input, "audience", APPLICATION_AUDIENCES);
  const status = readOneOf(input, "status", QUEUE_APPLICATION_STATUSES);

  // Keys are added only when present: an absent filter must not serialize as
  // `?q=`, and `exactOptionalPropertyTypes` forbids an explicit `undefined`.
  return {
    ...(q !== undefined ? { q } : {}),
    ...(program !== undefined ? { program } : {}),
    ...(instance !== undefined ? { instance } : {}),
    ...(region !== undefined ? { region } : {}),
    ...(audience !== undefined ? { audience } : {}),
    ...(status !== undefined ? { status } : {}),
  };
}

export function parseReviewSearch(input: Record<string, unknown>): ReviewSearch {
  const instance = readString(input, "instance");
  const identified = readIdentified(input);
  const submission = readString(input, "submission");

  return {
    ...(instance !== undefined ? { instance } : {}),
    ...(identified !== undefined ? { identified } : {}),
    ...(submission !== undefined ? { submission } : {}),
  };
}

export function parseSelectionSearch(input: Record<string, unknown>): SelectionSearch {
  const instance = readString(input, "instance");
  const sort = readOneOf(input, "sort", SELECTION_SORT_KEYS);
  const dir = readOneOf(input, "dir", SORT_DIRECTIONS);
  const status = readOneOf(input, "status", QUEUE_APPLICATION_STATUSES);

  return {
    ...(instance !== undefined ? { instance } : {}),
    ...(sort !== undefined ? { sort } : {}),
    ...(dir !== undefined ? { dir } : {}),
    ...(status !== undefined ? { status } : {}),
  };
}

export function parseSubmissionSearch(input: Record<string, unknown>): SubmissionSearch {
  const identified = readIdentified(input);
  return { ...(identified !== undefined ? { identified } : {}) };
}

export function hasActiveQueueFilters(search: QueueSearch): boolean {
  return Object.keys(search).length > 0;
}

/** Blind unless the URL says otherwise, on every screen that shows answers. */
export function isBlind(search: { readonly identified?: boolean }): boolean {
  return search.identified !== true;
}

/** Score, descending: the board opens on whoever scored highest. */
export const DEFAULT_SELECTION_SORT: {
  readonly sort: SelectionSortKey;
  readonly dir: SortDirection;
} = { sort: "score", dir: "desc" };

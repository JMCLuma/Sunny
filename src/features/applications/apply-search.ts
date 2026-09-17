import type { Id } from "@/features/operations/domain";

/**
 * URL state for `/my/apply`: which household member the camp list is for.
 *
 * Hand-written rather than a schema library, matching `program-filters.ts` —
 * one field does not earn a dependency. An unrecognised or stale `profile`
 * value is dropped rather than trusted, so a bookmarked link degrades to the
 * profile picker instead of erroring.
 */
export interface ApplySearch {
  readonly profile?: Id;
}

export function parseApplySearch(input: Record<string, unknown>): ApplySearch {
  const value = input["profile"];
  if (typeof value !== "string") return {};
  const trimmed = value.trim().slice(0, 120);
  return trimmed.length === 0 ? {} : { profile: trimmed };
}

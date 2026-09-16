import type { Id } from "./common";

/**
 * A region is the canonical geography used across the module.
 *
 * There is deliberately no second geography table: a region *is* an
 * `Organization` with `kind: "region"`, and `RegionId` is that organization's
 * id. Keeping one identifier space means the id a program instance carries is
 * the same id the authorization service compares against for the `region`
 * scope, and the same id a future Row Level Security policy will match on.
 *
 * `Region` is the read-side projection of those organizations — enough to
 * label and filter by, without re-stating the organization tree.
 */
export type RegionId = Id;

export interface Region {
  readonly id: RegionId;
  readonly name: string;
  /** Short code used in labels and reports, e.g. `SW`. */
  readonly code: string;
}

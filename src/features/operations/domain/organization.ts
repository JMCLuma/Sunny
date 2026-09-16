import type { Id, Metadata, RecordStatus } from "./common";

/**
 * An organizational unit that owns programs and people — the national body, a
 * region, or a local jurisdiction. Modelled as a self-referencing tree so that
 * `region`-scoped authorization can be resolved by walking up `parentId`.
 */
export interface Organization {
  readonly id: Id;
  readonly name: string;
  /** Short code used in reports and IDs, e.g. `SW`. */
  readonly code: string;
  readonly kind: "national" | "region" | "jurisdiction";
  /** `null` for the root of the tree. */
  readonly parentId: Id | null;
  readonly status: RecordStatus;
  readonly metadata?: Metadata;
}

import type {
  OperationsAction,
  OperationsResource,
  PermissionKey,
  PermissionScope,
  RequiredScope,
} from "./types";

/**
 * The permission catalogue.
 *
 * Authorization is allow-listed: a permission that is not built from a known
 * resource *and* a known action does not exist, and a request for it is denied
 * regardless of what grants an actor carries. This is what makes a typo in a
 * grant fail closed instead of silently widening access.
 */

export const OPERATIONS_RESOURCES = [
  "operations",
  "programs",
  "applications",
  "people",
  "finance",
  "compliance",
  "vendors",
  "risk",
  "documents",
  "insights",
  "marketing",
  "admin",
] as const satisfies readonly OperationsResource[];

export const OPERATIONS_ACTIONS = [
  "view",
  "create",
  "update",
  "approve",
  "export",
  "manage",
] as const satisfies readonly OperationsAction[];

const RESOURCE_SET: ReadonlySet<string> = new Set(OPERATIONS_RESOURCES);
const ACTION_SET: ReadonlySet<string> = new Set(OPERATIONS_ACTIONS);

export function isKnownResource(value: string): value is OperationsResource {
  return RESOURCE_SET.has(value);
}

export function isKnownAction(value: string): value is OperationsAction {
  return ACTION_SET.has(value);
}

export function toPermissionKey(
  resource: OperationsResource,
  action: OperationsAction,
): PermissionKey {
  return `${resource}.${action}`;
}

/** Every permission the system recognises. Anything else is unknown → denied. */
export const KNOWN_PERMISSIONS: ReadonlySet<string> = new Set(
  OPERATIONS_RESOURCES.flatMap((resource) =>
    OPERATIONS_ACTIONS.map((action) => toPermissionKey(resource, action)),
  ),
);

export function isKnownPermission(value: string): value is PermissionKey {
  return KNOWN_PERMISSIONS.has(value);
}

/**
 * Breadth ranking used to decide whether a held scope covers a required one.
 * A higher rank strictly contains every lower rank.
 *
 * `program` and `assigned_program` share a rank: both address a set of
 * programs, they just differ in where that set comes from, so neither one
 * automatically covers the other. Membership is checked separately.
 */
const SCOPE_RANK: Readonly<Record<PermissionScope, number>> = {
  all: 4,
  region: 3,
  program: 2,
  assigned_program: 2,
  self: 1,
};

/**
 * Does a grant at `held` satisfy a request that needs `required`?
 *
 * Rank alone is not enough for the two program scopes — a `program` grant must
 * not answer an `assigned_program` question, because the two draw from
 * different program sets. Callers still have to verify membership.
 */
export function scopeCovers(held: PermissionScope, required: RequiredScope): boolean {
  // "Do you hold this permission at all?" — satisfied by any grant. The caller
  // is responsible for filtering what the actor then sees.
  if (required === "any") return true;
  if (held === required) return true;
  if (held === "program" && required === "assigned_program") return false;
  if (held === "assigned_program" && required === "program") return false;
  return SCOPE_RANK[held] > SCOPE_RANK[required];
}

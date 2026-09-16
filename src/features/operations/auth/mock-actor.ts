import type { Actor, PermissionGrant } from "./types";

/**
 * The stand-in signed-in user for Phase 1.
 *
 * This is demo scaffolding, not a role definition: no roles are created, no
 * permission assignment is persisted, and nothing here is written to a
 * database. When Supabase Auth lands, `createAuthorizationService` is handed
 * an actor built from the session instead of this constant, and this file is
 * deleted.
 *
 * Page components must never import this directly — they receive an
 * `AuthorizationService` from route context so that swapping the source of the
 * actor touches one file.
 */

const DEMO_ORGANIZATION_ID = "org_jmc_national";

const demoGrants: readonly PermissionGrant[] = [
  // Read access across every Operations module — enough to load each route.
  { permission: "operations.view", scope: "all" },
  { permission: "programs.view", scope: "all" },
  { permission: "applications.view", scope: "all" },
  { permission: "people.view", scope: "all" },
  { permission: "finance.view", scope: "all" },
  { permission: "compliance.view", scope: "all" },
  { permission: "vendors.view", scope: "all" },
  { permission: "risk.view", scope: "all" },
  { permission: "documents.view", scope: "all" },
  { permission: "insights.view", scope: "all" },
  { permission: "marketing.view", scope: "all" },
  { permission: "admin.view", scope: "all" },
  // A few narrower grants so the scope machinery is exercised rather than
  // being a blanket "administrator can do everything".
  { permission: "finance.approve", scope: "all" },
  { permission: "compliance.approve", scope: "all" },
  { permission: "insights.export", scope: "all" },
  { permission: "admin.manage", scope: "all" },
  { permission: "applications.approve", scope: "all" },
  { permission: "people.manage", scope: "all" },
];

export const DEMO_ADMINISTRATOR: Actor = {
  id: "actor_demo_administrator",
  personId: "person_demo_administrator",
  displayName: "Demo Administrator",
  roleLabel: "Demo Administrator",
  organizationId: DEMO_ORGANIZATION_ID,
  isAuthenticated: true,
  grants: demoGrants,
  assignedProgramIds: [],
};

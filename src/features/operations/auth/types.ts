import type { Id } from "../domain";

/**
 * Authorization vocabulary for the Operations module.
 *
 * Nothing here knows about React, routing or Supabase. Routes, navigation and
 * components all ask the same `AuthorizationService` questions, so the mock
 * implementation used in Phase 1 can be swapped for a Supabase-backed one
 * without touching a single page component.
 */

/** A protected area of the module. Unknown resources are always denied. */
export type OperationsResource =
  | "operations"
  | "programs"
  | "finance"
  | "compliance"
  | "vendors"
  | "risk"
  | "documents"
  | "insights"
  | "marketing"
  | "admin";

/** What the actor wants to do. Unknown actions are always denied. */
export type OperationsAction = "view" | "create" | "update" | "approve" | "export" | "manage";

/**
 * How far a grant reaches.
 *
 * - `all` — every organization and program
 * - `region` — the organizations named on the grant (and nothing else)
 * - `program` — the programs named on the grant
 * - `assigned_program` — only programs the actor is personally assigned to
 * - `self` — only records about the actor themselves
 */
export type PermissionScope = "all" | "region" | "program" | "assigned_program" | "self";

/**
 * What a *caller* needs, which is not always a grant scope.
 *
 * `any` means "holds this permission at some scope" and exists for one job:
 * letting an actor through a module's front door so the module can then filter
 * its contents. A region-scoped actor must be able to open Programs and see
 * their region — they just must not see anyone else's. Detail routes still ask
 * the precise scoped question, so `any` never stands in for a real check.
 *
 * `any` is deliberately not a grant scope: no grant can be written at it.
 */
export type RequiredScope = PermissionScope | "any";

/** Canonical permission string, e.g. `finance.approve`. */
export type PermissionKey = `${OperationsResource}.${OperationsAction}`;

/**
 * One permission the actor holds, at one scope.
 *
 * `organizationIds` / `programIds` narrow `region` and `program` scopes. They
 * are ignored for `all`, `assigned_program` and `self`.
 */
export interface PermissionGrant {
  readonly permission: PermissionKey;
  readonly scope: PermissionScope;
  readonly organizationIds?: readonly Id[];
  readonly programIds?: readonly Id[];
}

/**
 * Who the request is acting as.
 *
 * `personId` is separate from `id` because a login and a person are distinct
 * records (see `UserAccountReference`): a service account has no person, and a
 * person may exist long before they ever sign in.
 */
export interface Actor {
  readonly id: Id;
  readonly personId: Id | null;
  readonly displayName: string;
  /** Label shown in the UI, e.g. "Demo Administrator". Not a real role record. */
  readonly roleLabel: string;
  readonly organizationId: Id;
  readonly isAuthenticated: boolean;
  readonly grants: readonly PermissionGrant[];
  /** Programs backing the `assigned_program` scope. */
  readonly assignedProgramIds: readonly Id[];
}

/**
 * A question put to the authorization service.
 *
 * `scope` is what the *caller* needs, not what the actor has: a page listing
 * every program asks for `all`, while a page showing one program asks for
 * `program` and passes `programId`.
 */
export interface AccessRequest {
  readonly resource: OperationsResource;
  readonly action: OperationsAction;
  readonly scope?: RequiredScope;
  readonly resourceId?: Id;
  readonly organizationId?: Id;
  readonly programId?: Id;
}

export type AuthorizationDenialReason =
  | "unauthenticated"
  | "unknown_resource"
  | "unknown_action"
  | "unknown_permission"
  | "no_grant"
  | "out_of_scope";

export type AuthorizationDecision =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason: AuthorizationDenialReason;
      readonly detail: string;
    };

/** Anything that can be shown or hidden based on a permission. */
export interface AuthorizedItem {
  readonly access: AccessRequest;
}

/**
 * The contract every consumer depends on.
 *
 * Implementations must fail closed: any request they cannot positively
 * authorize is denied.
 */
export interface AuthorizationService {
  readonly actor: Actor;
  /** Boolean answer for the common case. */
  can(request: AccessRequest): boolean;
  /** Same evaluation as `can`, with the reason — used by route guards and tests. */
  explain(request: AccessRequest): AuthorizationDecision;
  /** Convenience for the very common "may this actor touch this program?". */
  canAccessProgram(programId: Id, action?: OperationsAction): boolean;
  /** Keeps only the items whose `access` request the actor satisfies. */
  filterAuthorized<T extends AuthorizedItem>(items: readonly T[]): readonly T[];
}

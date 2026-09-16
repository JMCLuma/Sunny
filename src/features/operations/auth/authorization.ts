import type { Id } from "../domain";
import {
  isKnownAction,
  isKnownPermission,
  isKnownResource,
  scopeCovers,
  toPermissionKey,
} from "./permissions";
import type {
  AccessRequest,
  Actor,
  AuthorizationDecision,
  AuthorizationService,
  AuthorizedItem,
  OperationsAction,
  PermissionGrant,
} from "./types";

const ALLOWED: AuthorizationDecision = { allowed: true };

function deny(
  reason: Exclude<AuthorizationDecision, { allowed: true }>["reason"],
  detail: string,
): AuthorizationDecision {
  return { allowed: false, reason, detail };
}

/**
 * Default scope for a request that does not state one.
 *
 * `all` is the strictest possible default: a caller that forgets to say how
 * narrow its question is gets the broadest requirement, so an actor with only
 * a regional grant is denied rather than accidentally allowed.
 */
const DEFAULT_REQUIRED_SCOPE = "all" as const;

/**
 * Evaluates one grant against one request.
 *
 * Scope-specific membership is checked here rather than in `scopeCovers`
 * because it needs the request's organization/program context.
 */
function grantSatisfies(grant: PermissionGrant, request: AccessRequest, actor: Actor): boolean {
  const requiredScope = request.scope ?? DEFAULT_REQUIRED_SCOPE;
  if (!scopeCovers(grant.scope, requiredScope)) return false;

  // A bare "holds this permission somewhere" question has no subject to match
  // a region or program against, so a matching grant is the whole answer.
  if (requiredScope === "any") return true;

  switch (grant.scope) {
    case "all":
      return true;

    case "region": {
      // An unrestricted regional grant covers the actor's own organization
      // only; a listed grant covers exactly the organizations it names.
      const allowedOrganizations = grant.organizationIds ?? [actor.organizationId];
      if (request.organizationId === undefined) return false;
      return allowedOrganizations.includes(request.organizationId);
    }

    case "program": {
      const allowedPrograms = grant.programIds ?? [];
      if (request.programId === undefined) return false;
      return allowedPrograms.includes(request.programId);
    }

    case "assigned_program": {
      if (request.programId === undefined) return false;
      return actor.assignedProgramIds.includes(request.programId);
    }

    case "self": {
      // `self` answers only questions about the actor's own record.
      if (request.resourceId === undefined) return false;
      return request.resourceId === actor.personId || request.resourceId === actor.id;
    }

    default:
      return false;
  }
}

/**
 * Builds the authorization service around an actor.
 *
 * Phase 1 hands this a mock actor. When Supabase Auth arrives the only change
 * is where the actor comes from — the session user is resolved to a person via
 * `UserAccountReference`, their grants are read from the permissions tables,
 * and the same object is handed to the same routes and components. Server-side
 * enforcement moves to Row Level Security at that point; this service stays as
 * the client-side gate that decides what to render and which routes to allow.
 */
export function createAuthorizationService(actor: Actor): AuthorizationService {
  function explain(request: AccessRequest): AuthorizationDecision {
    if (!actor.isAuthenticated) {
      return deny("unauthenticated", "No authenticated actor.");
    }
    if (!isKnownResource(request.resource)) {
      return deny("unknown_resource", `Unknown resource "${request.resource}".`);
    }
    if (!isKnownAction(request.action)) {
      return deny("unknown_action", `Unknown action "${request.action}".`);
    }

    const permission = toPermissionKey(request.resource, request.action);
    if (!isKnownPermission(permission)) {
      return deny("unknown_permission", `Unknown permission "${permission}".`);
    }

    const matching = actor.grants.filter((grant) => grant.permission === permission);
    if (matching.length === 0) {
      return deny("no_grant", `Actor holds no grant for "${permission}".`);
    }

    const satisfied = matching.some((grant) => grantSatisfies(grant, request, actor));
    if (!satisfied) {
      return deny(
        "out_of_scope",
        `Actor holds "${permission}" but not for the requested scope "${
          request.scope ?? DEFAULT_REQUIRED_SCOPE
        }".`,
      );
    }

    return ALLOWED;
  }

  function can(request: AccessRequest): boolean {
    return explain(request).allowed;
  }

  return {
    actor,
    can,
    explain,
    canAccessProgram(programId: Id, action: OperationsAction = "view"): boolean {
      // Try the broadest question first, then narrow: an actor with `all` or a
      // regional grant is allowed without needing program membership.
      if (can({ resource: "programs", action, scope: "all" })) return true;
      if (
        can({
          resource: "programs",
          action,
          scope: "region",
          organizationId: actor.organizationId,
          programId,
        })
      ) {
        return true;
      }
      if (can({ resource: "programs", action, scope: "program", programId })) return true;
      return can({ resource: "programs", action, scope: "assigned_program", programId });
    },
    filterAuthorized<T extends AuthorizedItem>(items: readonly T[]): readonly T[] {
      return items.filter((item) => can(item.access));
    },
  };
}

import type { AccessRequest, AuthorizationDecision, AuthorizationService } from "./types";

/**
 * Thrown when a route is entered without the permission it requires.
 *
 * Routes throw this from `beforeLoad`, so the check runs on the server during
 * SSR and again on client navigation — hiding a navigation link is never the
 * only thing standing between an actor and a module.
 */
export class OperationsAccessDeniedError extends Error {
  readonly decision: Extract<AuthorizationDecision, { allowed: false }>;
  readonly request: AccessRequest;

  constructor(
    request: AccessRequest,
    decision: Extract<AuthorizationDecision, { allowed: false }>,
  ) {
    super(`Access denied for ${request.resource}.${request.action}: ${decision.detail}`);
    this.name = "OperationsAccessDeniedError";
    this.request = request;
    this.decision = decision;
  }
}

export function isOperationsAccessDeniedError(
  error: unknown,
): error is OperationsAccessDeniedError {
  return error instanceof OperationsAccessDeniedError;
}

/**
 * Route-level gate. Returns normally when access is allowed and throws
 * `OperationsAccessDeniedError` otherwise.
 */
export function requireAccess(authorization: AuthorizationService, request: AccessRequest): void {
  const decision = authorization.explain(request);
  if (!decision.allowed) {
    throw new OperationsAccessDeniedError(request, decision);
  }
}

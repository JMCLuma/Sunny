import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  createAuthorizationService,
  DEMO_ADMINISTRATOR,
  isOperationsAccessDeniedError,
  OperationsAccessDeniedError,
  requireAccess,
  type Actor,
} from "../auth";
import { getOperationsModule, OPERATIONS_MODULES } from "../navigation";

const noGrants: Actor = {
  id: "actor_empty",
  personId: null,
  displayName: "No Access",
  roleLabel: "No Access",
  organizationId: "org_region_a",
  isAuthenticated: true,
  grants: [],
  assignedProgramIds: [],
};

describe("route guard", () => {
  test("allows a permitted route without throwing", () => {
    const authorization = createAuthorizationService(DEMO_ADMINISTRATOR);
    assert.doesNotThrow(() => {
      requireAccess(authorization, getOperationsModule("finance").access);
    });
  });

  test("throws a typed error when the actor lacks the permission", () => {
    const authorization = createAuthorizationService(noGrants);
    assert.throws(
      () => requireAccess(authorization, getOperationsModule("finance").access),
      (error: unknown) => {
        assert.ok(error instanceof OperationsAccessDeniedError);
        assert.ok(isOperationsAccessDeniedError(error));
        assert.equal(error.decision.allowed, false);
        assert.equal(error.decision.reason, "no_grant");
        assert.equal(error.request.resource, "finance");
        return true;
      },
    );
  });

  test("every module route is guarded by the same access request the sidebar filters on", () => {
    // Navigation and route protection must read from one source; if they ever
    // diverge, a hidden link would still be reachable by URL.
    for (const module of OPERATIONS_MODULES) {
      assert.deepEqual(module.access, getOperationsModule(module.id).access);
    }
  });

  test("a guarded route rejects an actor for whom navigation is empty", () => {
    const authorization = createAuthorizationService(noGrants);
    assert.equal(authorization.filterAuthorized(OPERATIONS_MODULES).length, 0);
    for (const module of OPERATIONS_MODULES) {
      assert.throws(() => requireAccess(authorization, module.access), OperationsAccessDeniedError);
    }
  });
});

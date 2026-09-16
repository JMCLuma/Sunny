import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  createAuthorizationService,
  DEMO_ADMINISTRATOR,
  type Actor,
  type OperationsAction,
  type OperationsResource,
  type PermissionGrant,
} from "../auth";
import { OPERATIONS_MODULES } from "../navigation";

function actorWith(grants: readonly PermissionGrant[], overrides: Partial<Actor> = {}): Actor {
  return {
    id: "actor_test",
    personId: "person_test",
    displayName: "Test Actor",
    roleLabel: "Test Actor",
    organizationId: "org_region_a",
    isAuthenticated: true,
    grants,
    assignedProgramIds: [],
    ...overrides,
  };
}

describe("authorization defaults", () => {
  test("an actor with no grants is denied", () => {
    const authorization = createAuthorizationService(actorWith([]));
    assert.equal(authorization.can({ resource: "finance", action: "view" }), false);
    assert.equal(
      authorization.explain({ resource: "finance", action: "view" }).allowed ? "allowed" : "denied",
      "denied",
    );
  });

  test("an unauthenticated actor is denied even when it carries grants", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "finance.view", scope: "all" }], { isAuthenticated: false }),
    );
    const decision = authorization.explain({ resource: "finance", action: "view" });
    assert.equal(decision.allowed, false);
    assert.equal(decision.allowed === false && decision.reason, "unauthenticated");
  });

  test("an unknown resource is denied, not silently allowed", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "finance.view", scope: "all" }]),
    );
    const decision = authorization.explain({
      resource: "payroll" as OperationsResource,
      action: "view",
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.allowed === false && decision.reason, "unknown_resource");
  });

  test("an unknown action is denied", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "finance.view", scope: "all" }]),
    );
    const decision = authorization.explain({
      resource: "finance",
      action: "delete" as OperationsAction,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.allowed === false && decision.reason, "unknown_action");
  });

  test("a grant for one permission does not answer for another", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "finance.view", scope: "all" }]),
    );
    assert.equal(authorization.can({ resource: "finance", action: "view" }), true);
    assert.equal(authorization.can({ resource: "finance", action: "approve" }), false);
    assert.equal(authorization.can({ resource: "compliance", action: "view" }), false);
  });

  test("a request that omits its scope is held to the broadest requirement", () => {
    const authorization = createAuthorizationService(
      actorWith([
        { permission: "programs.view", scope: "region", organizationIds: ["org_region_a"] },
      ]),
    );
    // No scope stated => treated as `all`, which a regional grant cannot cover.
    assert.equal(authorization.can({ resource: "programs", action: "view" }), false);
  });
});

describe("scope handling", () => {
  test("`all` covers every narrower scope", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "programs.view", scope: "all" }]),
    );
    assert.equal(
      authorization.can({ resource: "programs", action: "view", scope: "region" }),
      true,
    );
    assert.equal(
      authorization.can({
        resource: "programs",
        action: "view",
        scope: "program",
        programId: "prog_mosaic",
      }),
      true,
    );
  });

  test("a regional grant is limited to the organizations it names", () => {
    const authorization = createAuthorizationService(
      actorWith([
        { permission: "programs.view", scope: "region", organizationIds: ["org_region_a"] },
      ]),
    );
    assert.equal(
      authorization.can({
        resource: "programs",
        action: "view",
        scope: "region",
        organizationId: "org_region_a",
      }),
      true,
    );
    assert.equal(
      authorization.can({
        resource: "programs",
        action: "view",
        scope: "region",
        organizationId: "org_region_b",
      }),
      false,
    );
  });

  test("a narrower grant never covers a broader request", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "programs.view", scope: "program", programIds: ["prog_mosaic"] }]),
    );
    assert.equal(authorization.can({ resource: "programs", action: "view", scope: "all" }), false);
    assert.equal(
      authorization.can({ resource: "programs", action: "view", scope: "region" }),
      false,
    );
  });

  test("`program` and `assigned_program` do not stand in for each other", () => {
    const listed = createAuthorizationService(
      actorWith([{ permission: "programs.view", scope: "program", programIds: ["prog_mosaic"] }]),
    );
    assert.equal(
      listed.can({
        resource: "programs",
        action: "view",
        scope: "assigned_program",
        programId: "prog_mosaic",
      }),
      false,
    );

    const assigned = createAuthorizationService(
      actorWith([{ permission: "programs.view", scope: "assigned_program" }], {
        assignedProgramIds: ["prog_mosaic"],
      }),
    );
    assert.equal(
      assigned.can({
        resource: "programs",
        action: "view",
        scope: "program",
        programId: "prog_mosaic",
      }),
      false,
    );
  });

  test("`self` answers only for the actor's own record", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "programs.view", scope: "self" }]),
    );
    assert.equal(
      authorization.can({
        resource: "programs",
        action: "view",
        scope: "self",
        resourceId: "person_test",
      }),
      true,
    );
    assert.equal(
      authorization.can({
        resource: "programs",
        action: "view",
        scope: "self",
        resourceId: "person_someone_else",
      }),
      false,
    );
    // A `self` grant with no subject cannot be resolved, so it is denied.
    assert.equal(authorization.can({ resource: "programs", action: "view", scope: "self" }), false);
  });
});

describe("canAccessProgram", () => {
  test("an organization-wide grant reaches every program", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "programs.view", scope: "all" }]),
    );
    assert.equal(authorization.canAccessProgram("prog_anything"), true);
  });

  test("an assigned-program grant reaches only assigned programs", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "programs.view", scope: "assigned_program" }], {
        assignedProgramIds: ["prog_mosaic"],
      }),
    );
    assert.equal(authorization.canAccessProgram("prog_mosaic"), true);
    assert.equal(authorization.canAccessProgram("prog_embark"), false);
  });

  test("the action is respected, not just the resource", () => {
    const authorization = createAuthorizationService(
      actorWith([{ permission: "programs.view", scope: "all" }]),
    );
    assert.equal(authorization.canAccessProgram("prog_mosaic", "view"), true);
    assert.equal(authorization.canAccessProgram("prog_mosaic", "manage"), false);
  });
});

describe("navigation filtering", () => {
  test("only modules the actor may open survive filtering", () => {
    const authorization = createAuthorizationService(
      actorWith([
        { permission: "operations.view", scope: "all" },
        { permission: "finance.view", scope: "all" },
      ]),
    );
    const visible = authorization.filterAuthorized(OPERATIONS_MODULES).map((module) => module.id);
    assert.deepEqual(visible, ["overview", "finance"]);
  });

  test("an actor with nothing sees no navigation at all", () => {
    const authorization = createAuthorizationService(actorWith([]));
    assert.equal(authorization.filterAuthorized(OPERATIONS_MODULES).length, 0);
  });
});

describe("the demo administrator", () => {
  test("can open every Operations route defined today", () => {
    const authorization = createAuthorizationService(DEMO_ADMINISTRATOR);
    for (const module of OPERATIONS_MODULES) {
      assert.equal(authorization.can(module.access), true, `expected access to ${module.id}`);
    }
  });

  test("still does not hold permissions nobody granted", () => {
    const authorization = createAuthorizationService(DEMO_ADMINISTRATOR);
    assert.equal(authorization.can({ resource: "risk", action: "manage" }), false);
    assert.equal(authorization.can({ resource: "documents", action: "approve" }), false);
  });
});

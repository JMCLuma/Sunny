import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  createAuthorizationService,
  createProgramAccessPolicy,
  DEMO_ADMINISTRATOR,
  filterEventRows,
  filterInstanceDetail,
  filterInstanceSummaries,
  filterProgramDetail,
  filterProgramSummaries,
  OperationsAccessDeniedError,
  requireAccess,
  toInstanceScopeRef,
  type Actor,
  type OperationsResource,
  type PermissionGrant,
} from "../auth";
import { createMockOperationsRepository } from "../data";
import { getOperationsModule, OPERATIONS_MODULES } from "../navigation";

const REFERENCE_DATE = "2026-09-11T00:00:00.000Z";
const SOUTHWEST = "org_southwest";
const MOSAIC = "prog_mosaic";

const repository = createMockOperationsRepository();

function actorWith(grants: readonly PermissionGrant[], overrides: Partial<Actor> = {}): Actor {
  return {
    id: "actor_test",
    personId: "person_test",
    displayName: "Test Actor",
    roleLabel: "Test Actor",
    organizationId: "org_national",
    isAuthenticated: true,
    grants,
    assignedProgramIds: [],
    ...overrides,
  };
}

const allProgramsActor = actorWith([
  { permission: "programs.view", scope: "all" },
  { permission: "operations.view", scope: "all" },
]);

const programScopedActor = actorWith([
  { permission: "programs.view", scope: "program", programIds: [MOSAIC] },
]);

const regionScopedActor = actorWith([
  { permission: "programs.view", scope: "region", organizationIds: [SOUTHWEST] },
]);

const noAccessActor = actorWith([{ permission: "finance.view", scope: "all" }]);

async function policyFor(actor: Actor) {
  const instances = await repository.listProgramInstanceSummaries({
    referenceDate: REFERENCE_DATE,
  });
  return {
    policy: createProgramAccessPolicy(
      createAuthorizationService(actor),
      instances.map(toInstanceScopeRef),
    ),
    instances,
  };
}

describe("entering the Programs module", () => {
  test("a scoped actor may open the module even without blanket access", () => {
    // The module gate asks "any Programs access at all?" — the contents are
    // then filtered. Demanding `all` here would lock out every regional user.
    for (const actor of [allProgramsActor, programScopedActor, regionScopedActor]) {
      assert.doesNotThrow(() => {
        requireAccess(createAuthorizationService(actor), getOperationsModule("programs").access);
      });
    }
  });

  test("an actor with no Programs grant is refused at the door", () => {
    assert.throws(
      () =>
        requireAccess(
          createAuthorizationService(noAccessActor),
          getOperationsModule("programs").access,
        ),
      OperationsAccessDeniedError,
    );
  });

  test("navigation filtering agrees with the route guard", () => {
    const authorization = createAuthorizationService(regionScopedActor);
    const visible = authorization.filterAuthorized(OPERATIONS_MODULES).map((module) => module.id);
    assert.deepEqual(visible, ["programs"]);
  });

  test("the `any` scope does not weaken deny-by-default", () => {
    const authorization = createAuthorizationService(regionScopedActor);
    // Unknown resources and ungranted permissions stay denied at every scope.
    assert.equal(
      // Deliberately outside the resource union: an unknown resource must be
      // denied even when the caller only asks for "any" scope.
      authorization.can({
        resource: "payroll" as OperationsResource,
        action: "view",
        scope: "any",
      }),
      false,
    );
    assert.equal(authorization.can({ resource: "finance", action: "view", scope: "any" }), false);
    assert.equal(
      authorization.can({ resource: "programs", action: "manage", scope: "any" }),
      false,
    );
  });

  test("the demo administrator still reaches every module", () => {
    const authorization = createAuthorizationService(DEMO_ADMINISTRATOR);
    for (const module of OPERATIONS_MODULES) {
      assert.equal(authorization.can(module.access), true, module.id);
    }
  });
});

describe("program access policy", () => {
  test("an all-program actor sees every program and instance", async () => {
    const { policy, instances } = await policyFor(allProgramsActor);
    assert.ok(instances.length > 0);
    for (const summary of instances) {
      assert.equal(policy.canViewInstance(toInstanceScopeRef(summary)), true);
      assert.equal(policy.canViewProgram(summary.instance.programId), true);
    }
  });

  test("a program-scoped actor sees only the granted program", async () => {
    const { policy, instances } = await policyFor(programScopedActor);

    assert.equal(policy.canViewProgram(MOSAIC), true);
    assert.equal(policy.canViewProgramDirectly(MOSAIC), true);

    const others = instances.filter((row) => row.instance.programId !== MOSAIC);
    assert.ok(others.length > 0, "seed data must contain other programs");
    for (const summary of others) {
      assert.equal(policy.canViewInstance(toInstanceScopeRef(summary)), false);
      assert.equal(policy.canViewProgram(summary.instance.programId), false);
    }
    for (const summary of instances.filter((row) => row.instance.programId === MOSAIC)) {
      assert.equal(policy.canViewInstance(toInstanceScopeRef(summary)), true);
    }
  });

  test("a region-scoped actor sees only instances in that region", async () => {
    const { policy, instances } = await policyFor(regionScopedActor);

    const inRegion = instances.filter((row) => row.instance.organizationId === SOUTHWEST);
    const elsewhere = instances.filter((row) => row.instance.organizationId !== SOUTHWEST);
    assert.ok(inRegion.length > 0 && elsewhere.length > 0);

    for (const summary of inRegion) {
      assert.equal(policy.canViewInstance(toInstanceScopeRef(summary)), true);
    }
    for (const summary of elsewhere) {
      assert.equal(policy.canViewInstance(toInstanceScopeRef(summary)), false);
    }
  });

  test("a region-scoped actor reaches a program only through an instance in region", async () => {
    const { policy, instances } = await policyFor(regionScopedActor);

    const programsInRegion = new Set(
      instances
        .filter((row) => row.instance.organizationId === SOUTHWEST)
        .map((row) => row.instance.programId),
    );
    const programsElsewhereOnly = new Set(
      instances
        .filter((row) => !programsInRegion.has(row.instance.programId))
        .map((row) => row.instance.programId),
    );

    for (const programId of programsInRegion) {
      assert.equal(policy.canViewProgram(programId), true, programId);
      // Reachable through a region grant is not the same as reachable directly.
      assert.equal(policy.canViewProgramDirectly(programId), false, programId);
    }
    for (const programId of programsElsewhereOnly) {
      assert.equal(policy.canViewProgram(programId), false, programId);
    }
  });

  test("an actor with no Programs grant sees nothing", async () => {
    const { policy, instances } = await policyFor(noAccessActor);
    for (const summary of instances) {
      assert.equal(policy.canViewInstance(toInstanceScopeRef(summary)), false);
      assert.equal(policy.canViewProgram(summary.instance.programId), false);
    }
  });
});

describe("event visibility through instances", () => {
  test("a shared event is reachable through any one visible instance", async () => {
    const { policy } = await policyFor(regionScopedActor);
    const events = await repository.listProgramEvents({
      referenceDate: REFERENCE_DATE,
      includePast: true,
    });

    const shared = events.filter((row) => row.event.programInstanceIds.length > 1);
    assert.ok(shared.length > 0, "seed data must contain a multi-instance event");

    for (const row of shared) {
      const reachable = row.instances.some(
        (instance) => instance.regionId === SOUTHWEST && policy.canViewInstance(instance),
      );
      assert.equal(
        policy.canViewEvent({
          programId: row.event.programId,
          programInstanceIds: row.event.programInstanceIds,
        }),
        reachable,
      );
    }
  });

  test("filtering an event row trims the links the actor may not see", async () => {
    const { policy } = await policyFor(regionScopedActor);
    const events = await repository.listProgramEvents({
      referenceDate: REFERENCE_DATE,
      includePast: true,
    });

    const filtered = filterEventRows(policy, events);
    for (const row of filtered) {
      for (const instance of row.instances) {
        assert.equal(instance.regionId, SOUTHWEST, `${row.event.id} leaked a link`);
      }
      for (const region of row.regions) {
        assert.equal(region.id, SOUTHWEST, `${row.event.id} leaked a region`);
      }
    }
    assert.ok(filtered.length < events.length, "region scoping should remove some events");
  });

  test("an actor with no access sees no events at all", async () => {
    const { policy } = await policyFor(noAccessActor);
    const events = await repository.listProgramEvents({ referenceDate: REFERENCE_DATE });
    assert.equal(filterEventRows(policy, events).length, 0);
  });
});

describe("filtering repository results before rendering", () => {
  test("program summaries lose out-of-scope instances and recount", async () => {
    const { policy } = await policyFor(regionScopedActor);
    const summaries = await repository.listProgramSummaries({ referenceDate: REFERENCE_DATE });
    const visible = filterProgramSummaries(policy, summaries, REFERENCE_DATE);

    assert.ok(visible.length > 0);
    assert.ok(visible.length < summaries.length, "some programs should drop out entirely");

    for (const row of visible) {
      assert.ok(row.instances.length > 0);
      for (const summary of row.instances) {
        assert.equal(summary.instance.organizationId, SOUTHWEST);
      }
      // Counts must describe what is shown, not what exists.
      assert.equal(row.instanceCount, row.instances.length);
      assert.deepEqual(
        row.regions.map((region) => region.id),
        [SOUTHWEST],
      );
    }
  });

  test("instance summaries are filtered for a program-scoped actor", async () => {
    const { policy, instances } = await policyFor(programScopedActor);
    const visible = filterInstanceSummaries(policy, instances);

    assert.ok(visible.length > 0);
    for (const summary of visible) {
      assert.equal(summary.instance.programId, MOSAIC);
    }
  });

  test("a denied program detail resolves to null, which the route turns into a not-found", async () => {
    const detail = await repository.getProgramDetail("prog_olympia", {
      referenceDate: REFERENCE_DATE,
    });
    assert.ok(detail);

    const instances = [...detail.current, ...detail.upcoming, ...detail.completed];
    const policy = createProgramAccessPolicy(
      createAuthorizationService(programScopedActor),
      instances.map(toInstanceScopeRef),
    );

    assert.equal(filterProgramDetail(policy, detail), null);
  });

  test("a visible program detail keeps only in-scope instances and rebuilds readiness", async () => {
    const detail = await repository.getProgramDetail(MOSAIC, { referenceDate: REFERENCE_DATE });
    assert.ok(detail);

    const instances = [...detail.current, ...detail.upcoming, ...detail.completed];
    const policy = createProgramAccessPolicy(
      createAuthorizationService(regionScopedActor),
      instances.map(toInstanceScopeRef),
    );

    const visible = filterProgramDetail(policy, detail);
    assert.ok(visible, "Mosaic runs in the southwest, so it stays reachable");

    const shown = [...visible.current, ...visible.upcoming, ...visible.completed];
    assert.ok(shown.length > 0);
    assert.ok(shown.length < instances.length, "other regions' sessions must be dropped");
    for (const summary of shown) {
      assert.equal(summary.instance.organizationId, SOUTHWEST);
    }

    // The roll-up may only count signals from instances that survived.
    const visibleSignalCount = shown.reduce(
      (total, summary) => total + summary.readiness.signals.length,
      0,
    );
    const rolledUp = visible.readiness.reduce(
      (total, row) => total + Object.values(row.counts).reduce((sum, count) => sum + count, 0),
      0,
    );
    assert.equal(rolledUp, visibleSignalCount);
  });

  test("an out-of-region instance cannot be reached by typing its URL", async () => {
    // The loader resolves the instance, then asks the policy. A denial here is
    // what makes the detail route a not-found rather than a rendered page.
    const instances = await repository.listProgramInstanceSummaries({
      referenceDate: REFERENCE_DATE,
    });
    const outOfRegion = instances.find((row) => row.instance.organizationId !== SOUTHWEST);
    assert.ok(outOfRegion);

    const detail = await repository.getProgramInstanceDetail(
      outOfRegion.instance.programId,
      outOfRegion.instance.id,
    );
    assert.ok(detail);

    const policy = createProgramAccessPolicy(
      createAuthorizationService(regionScopedActor),
      instances.map(toInstanceScopeRef),
    );
    assert.equal(filterInstanceDetail(policy, detail), null);
  });

  test("an in-region instance is reachable by URL", async () => {
    const instances = await repository.listProgramInstanceSummaries({
      referenceDate: REFERENCE_DATE,
    });
    const inRegion = instances.find((row) => row.instance.organizationId === SOUTHWEST);
    assert.ok(inRegion);

    const detail = await repository.getProgramInstanceDetail(
      inRegion.instance.programId,
      inRegion.instance.id,
    );
    assert.ok(detail);

    const policy = createProgramAccessPolicy(
      createAuthorizationService(regionScopedActor),
      instances.map(toInstanceScopeRef),
    );
    assert.notEqual(filterInstanceDetail(policy, detail), null);
  });
});

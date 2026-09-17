import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { createAuthorizationService } from "@/features/operations/auth";
import { createMockOperationsRepository } from "@/features/operations/data";
import { DEMO_PERSONAS } from "@/features/demo/personas";
import { createApplicationAccessPolicy, filterQueueRows } from "../access";
import { toApplicationScopeRef } from "../application-scope";

/**
 * The same personas the demo actually switches between, run against the same
 * mock repository every route uses — the closest this suite gets to
 * exercising the real thing without a browser.
 *
 * `reviewer` and `camp_lead` both hold a Mosaic-only grant; the point worth
 * proving is that neither one's *visible* queue ever contains a submission
 * from a program they were not granted, no matter how the repository's rows
 * are ordered or filtered.
 */

const repository = createMockOperationsRepository();

function personaPolicy(id: string) {
  const persona = DEMO_PERSONAS.find((entry) => entry.id === id);
  assert.ok(persona, `persona "${id}" must exist in the demo roster`);
  return async () => {
    const instances = await repository.listProgramInstances();
    return createApplicationAccessPolicy(
      createAuthorizationService(persona.actor),
      instances.map(toApplicationScopeRef),
    );
  };
}

describe("Applications & selection — persona scoping", () => {
  test("camp_lead sees only Mosaic submissions, however the queue is fetched", async () => {
    const policy = await personaPolicy("camp_lead")();
    const allRows = await repository.listApplicationQueue();
    const visible = filterQueueRows(policy, allRows);

    assert.ok(visible.length > 0, "the seeded Mosaic cohort must be visible to its own camp lead");
    for (const row of visible) {
      assert.equal(row.submission.programId, "prog_mosaic", row.submission.id);
    }
    assert.ok(
      visible.length < allRows.length,
      "a camp lead scoped to one program must see fewer rows than the full queue",
    );
  });

  test("camp_lead may decide for Mosaic; reviewer may score it but never decide", async () => {
    const campLeadPolicy = await personaPolicy("camp_lead")();
    const reviewerPolicy = await personaPolicy("reviewer")();

    assert.equal(campLeadPolicy.canDecideInstance("inst_mosaic_fall_ne"), true);
    assert.equal(reviewerPolicy.canScoreInstance("inst_mosaic_fall_ne"), true);
    assert.equal(reviewerPolicy.canDecideInstance("inst_mosaic_fall_ne"), false);
  });

  test("npt is scoped to the Southwest region across every program, not just one camp", async () => {
    const policy = await personaPolicy("npt")();
    const instances = await repository.listProgramInstances();

    const southwest = instances.filter((instance) => instance.organizationId === "org_southwest");
    const elsewhere = instances.filter((instance) => instance.organizationId !== "org_southwest");
    assert.ok(southwest.length > 0 && elsewhere.length > 0, "seed data must span regions");

    for (const instance of southwest) {
      assert.equal(policy.canViewInstance(instance.id), true, instance.id);
    }
    for (const instance of elsewhere) {
      assert.equal(policy.canViewInstance(instance.id), false, instance.id);
    }
  });

  test("senior_admin reaches every seeded instance", async () => {
    const policy = await personaPolicy("senior_admin")();
    const instances = await repository.listProgramInstances();
    for (const instance of instances) {
      assert.equal(policy.canViewInstance(instance.id), true, instance.id);
    }
  });

  test("a family persona holds no Applications grant at all", async () => {
    const policy = await personaPolicy("parent")();
    const instances = await repository.listProgramInstances();
    for (const instance of instances) {
      assert.equal(policy.canViewInstance(instance.id), false, instance.id);
    }
    assert.equal(policy.reachable.length, 0);
  });
});

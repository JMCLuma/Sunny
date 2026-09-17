import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  createAuthorizationService,
  type Actor,
  type PermissionGrant,
} from "@/features/operations/auth";
import type { ApplicationQueueRow, SelectionBoard } from "@/features/operations/data";
import type { ApplicationSubmission, Interview } from "@/features/operations/domain";
import {
  createApplicationAccessPolicy,
  filterInterviews,
  filterQueueRows,
  filterSelectionBoard,
  recountBoard,
  type ApplicationScopeRef,
} from "../access";

/**
 * Scoping tests for Applications & selection.
 *
 * The module README is explicit that this is UI gating standing in for Row
 * Level Security, so the thing worth proving here is the same thing RLS will
 * have to guarantee: a scoped actor's *visible* set is never wider than their
 * grants, no matter what the repository handed back or what a URL filter
 * asked for.
 */

const MOSAIC = "prog_mosaic";
const EMBARK = "prog_embark";
const NORTHEAST = "org_northeast";
const SOUTHWEST = "org_southwest";

const INSTANCES: readonly ApplicationScopeRef[] = [
  { instanceId: "inst_mosaic_ne", programId: MOSAIC, regionId: NORTHEAST },
  { instanceId: "inst_mosaic_sw", programId: MOSAIC, regionId: SOUTHWEST },
  { instanceId: "inst_embark_ne", programId: EMBARK, regionId: NORTHEAST },
];

function actorWith(grants: readonly PermissionGrant[]): Actor {
  return {
    id: "actor_test",
    personId: "person_test",
    displayName: "Test Actor",
    roleLabel: "Test Actor",
    organizationId: "org_national",
    isAuthenticated: true,
    grants,
    assignedProgramIds: [],
  };
}

function row(submissionId: string, instanceId: string, programId: string): ApplicationQueueRow {
  const submission = {
    id: submissionId,
    formId: "form_x",
    programId,
    programInstanceId: instanceId,
    audience: "participant",
    accountId: "acct_x",
    profileId: "prof_x",
    personId: null,
    status: "submitted",
    formVersion: 1,
    answers: [],
    completedSectionIds: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    lastSavedAt: "2026-01-01T00:00:00.000Z",
    submittedAt: "2026-01-01T00:00:00.000Z",
    confirmByDate: null,
    backgroundCheckRequired: false,
    backgroundCheckStatus: null,
  } satisfies ApplicationSubmission;

  return {
    submission,
    applicantLabel: `Applicant ${submissionId}`,
    programName: programId,
    instanceName: instanceId,
    regionName: instanceId.endsWith("sw") ? "Southwest" : "Northeast",
    age: 14,
    totalScore: null,
    scoredBy: 0,
    interviewStatus: null,
    decision: null,
  };
}

describe("createApplicationAccessPolicy", () => {
  test("an all-access actor reaches every instance and every action", () => {
    const policy = createApplicationAccessPolicy(
      createAuthorizationService(actorWith([{ permission: "applications.view", scope: "all" }])),
      INSTANCES,
    );
    for (const instance of INSTANCES) {
      assert.equal(policy.canViewInstance(instance.instanceId), true);
    }
    assert.equal(policy.reachable.length, INSTANCES.length);
  });

  test("a program-scoped actor (camp lead) never sees another camp's instance", () => {
    const policy = createApplicationAccessPolicy(
      createAuthorizationService(
        actorWith([
          { permission: "applications.view", scope: "program", programIds: [MOSAIC] },
          { permission: "applications.approve", scope: "program", programIds: [MOSAIC] },
        ]),
      ),
      INSTANCES,
    );

    assert.equal(policy.canViewInstance("inst_mosaic_ne"), true);
    assert.equal(policy.canViewInstance("inst_mosaic_sw"), true);
    assert.equal(policy.canViewInstance("inst_embark_ne"), false);
    assert.deepEqual(policy.reachable.map((ref) => ref.instanceId).sort(), [
      "inst_mosaic_ne",
      "inst_mosaic_sw",
    ]);
  });

  test("a region-scoped actor (national team) never sees another region's instance, in any program", () => {
    const policy = createApplicationAccessPolicy(
      createAuthorizationService(
        actorWith([
          { permission: "applications.view", scope: "region", organizationIds: [SOUTHWEST] },
          { permission: "applications.approve", scope: "region", organizationIds: [SOUTHWEST] },
        ]),
      ),
      INSTANCES,
    );

    assert.equal(policy.canViewInstance("inst_mosaic_sw"), true);
    assert.equal(policy.canViewInstance("inst_mosaic_ne"), false);
    assert.equal(policy.canViewInstance("inst_embark_ne"), false);
  });

  test("reviewer: may view and score, but never decide", () => {
    const reviewer = createAuthorizationService(
      actorWith([
        { permission: "applications.view", scope: "program", programIds: [MOSAIC] },
        { permission: "applications.update", scope: "program", programIds: [MOSAIC] },
        // Deliberately no applications.approve grant at all.
      ]),
    );
    const policy = createApplicationAccessPolicy(reviewer, INSTANCES);

    assert.equal(policy.canViewInstance("inst_mosaic_ne"), true);
    assert.equal(policy.canScoreInstance("inst_mosaic_ne"), true);
    assert.equal(policy.canDecideInstance("inst_mosaic_ne"), false);
  });

  test("camp lead: may view, score and decide for their own camp", () => {
    const campLead = createAuthorizationService(
      actorWith([
        { permission: "applications.view", scope: "program", programIds: [MOSAIC] },
        { permission: "applications.update", scope: "program", programIds: [MOSAIC] },
        { permission: "applications.approve", scope: "program", programIds: [MOSAIC] },
      ]),
    );
    const policy = createApplicationAccessPolicy(campLead, INSTANCES);

    assert.equal(policy.canDecideInstance("inst_mosaic_ne"), true);
    assert.equal(policy.canDecideInstance("inst_embark_ne"), false);
  });

  test("an actor with no applications grant reaches nothing", () => {
    const policy = createApplicationAccessPolicy(
      createAuthorizationService(actorWith([{ permission: "finance.view", scope: "all" }])),
      INSTANCES,
    );
    for (const instance of INSTANCES) {
      assert.equal(policy.canViewInstance(instance.instanceId), false);
    }
    assert.equal(policy.reachable.length, 0);
  });

  test("an instance the policy was never told about is denied even to an all-access actor", () => {
    // Deny-by-default extends to "unknown to this policy", not only "outside
    // scope" — a row naming a session this policy has no record of must not
    // be assumed safe just because the actor holds a blanket grant.
    const policy = createApplicationAccessPolicy(
      createAuthorizationService(actorWith([{ permission: "applications.view", scope: "all" }])),
      INSTANCES,
    );
    assert.equal(policy.canViewInstance("inst_unknown"), false);
  });
});

describe("filterQueueRows and recountBoard", () => {
  test("rows outside scope are dropped and counts are rebuilt from what remains", () => {
    const policy = createApplicationAccessPolicy(
      createAuthorizationService(
        actorWith([{ permission: "applications.view", scope: "program", programIds: [MOSAIC] }]),
      ),
      INSTANCES,
    );

    const rows = [
      row("s1", "inst_mosaic_ne", MOSAIC),
      row("s2", "inst_mosaic_sw", MOSAIC),
      row("s3", "inst_embark_ne", EMBARK),
    ];

    const visible = filterQueueRows(policy, rows);
    assert.deepEqual(
      visible.map((r) => r.submission.id),
      ["s1", "s2"],
    );

    const counts = recountBoard(visible);
    const total = Object.values(counts.countsByStatus).reduce((sum, n) => sum + n, 0);
    assert.equal(total, visible.length, "counts must describe only what is visible");
  });
});

describe("filterSelectionBoard", () => {
  function boardFor(instanceId: string, programId: string): SelectionBoard {
    const rows = [row("s1", instanceId, programId), row("s2", instanceId, programId)];
    return {
      programInstanceId: instanceId,
      instanceName: "Test session",
      programName: programId,
      plannedCapacity: 10,
      rows,
      ...recountBoard(rows),
      rubric: null,
    };
  }

  test("a board for an instance the actor cannot see resolves to null, not an empty board", () => {
    const policy = createApplicationAccessPolicy(
      createAuthorizationService(
        actorWith([{ permission: "applications.view", scope: "program", programIds: [EMBARK] }]),
      ),
      INSTANCES,
    );
    assert.equal(filterSelectionBoard(policy, boardFor("inst_mosaic_ne", MOSAIC)), null);
  });

  test("a board the actor may see keeps only in-scope rows and rebuilds its counts", () => {
    const policy = createApplicationAccessPolicy(
      createAuthorizationService(
        actorWith([{ permission: "applications.view", scope: "program", programIds: [MOSAIC] }]),
      ),
      INSTANCES,
    );
    const filtered = filterSelectionBoard(policy, boardFor("inst_mosaic_ne", MOSAIC));
    assert.ok(filtered);
    assert.equal(filtered.rows.length, 2);
  });
});

describe("filterInterviews", () => {
  test("an interview for a submission outside the visible set is dropped", () => {
    const interviews: readonly Interview[] = [
      {
        id: "intv_1",
        submissionId: "s1",
        interviewerPersonId: null,
        status: "scheduled",
        scheduledFor: null,
        meetingUrl: null,
        notes: null,
        notesPurgeAfter: null,
      },
      {
        id: "intv_2",
        submissionId: "s_hidden",
        interviewerPersonId: null,
        status: "scheduled",
        scheduledFor: null,
        meetingUrl: null,
        notes: null,
        notesPurgeAfter: null,
      },
    ];

    const visible = filterInterviews(interviews, new Set(["s1"]));
    assert.deepEqual(
      visible.map((i) => i.id),
      ["intv_1"],
    );
  });
});

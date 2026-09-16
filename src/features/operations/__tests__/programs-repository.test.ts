import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { createMockOperationsRepository } from "../data";
import { programEvents, programInstances, programs, readinessSignals } from "../data/mock-data";
import { READINESS_AREAS } from "../domain";
import type { ProgramInstanceSummary } from "../data/repository";

const REFERENCE_DATE = "2026-09-11T00:00:00.000Z";

function repo() {
  return createMockOperationsRepository();
}

function ids(values: readonly { readonly id: string }[]): string[] {
  return values.map((value) => value.id);
}

function instanceIds(summaries: readonly ProgramInstanceSummary[]): string[] {
  return summaries.map((summary) => summary.instance.id);
}

describe("program -> instance relationships", () => {
  test("listProgramSummaries returns each program with only its own instances", async () => {
    const summaries = await repo().listProgramSummaries({ referenceDate: REFERENCE_DATE });

    assert.equal(summaries.length, programs.length);
    for (const summary of summaries) {
      for (const instanceSummary of summary.instances) {
        assert.equal(instanceSummary.instance.programId, summary.program.id);
      }
    }
  });

  test("instanceCount/activeInstances/upcomingInstances agree with the instances array", async () => {
    const summaries = await repo().listProgramSummaries({ referenceDate: REFERENCE_DATE });

    for (const summary of summaries) {
      assert.equal(summary.instanceCount, summary.instances.length);
      assert.equal(
        summary.activeInstances,
        summary.instances.filter((instanceSummary) =>
          ["planning", "applications_open", "confirmed", "in_progress"].includes(
            instanceSummary.instance.status,
          ),
        ).length,
      );
      assert.ok(summary.activeInstances <= summary.instanceCount);
      assert.ok(summary.upcomingInstances <= summary.instanceCount);
    }
  });

  test("every program's instance total matches the seed", async () => {
    const summaries = await repo().listProgramSummaries({ referenceDate: REFERENCE_DATE });
    const totalInstances = summaries.reduce((sum, summary) => sum + summary.instanceCount, 0);
    assert.equal(totalInstances, programInstances.length);
    assert.equal(programInstances.length, 19);
  });
});

describe("events linked to multiple instances", () => {
  test("a multi-link event appears once, with one entry per linked instance", async () => {
    const rows = await repo().listProgramEvents({ includePast: true });

    const summit = rows.find((row) => row.event.id === "evt_mosaic_program_summit");
    const training = rows.find((row) => row.event.id === "evt_khidma_regional_training");
    assert.ok(summit, "summit event missing");
    assert.ok(training, "training event missing");

    assert.equal(rows.filter((row) => row.event.id === "evt_mosaic_program_summit").length, 1);
    assert.equal(rows.filter((row) => row.event.id === "evt_khidma_regional_training").length, 1);

    assert.equal(summit.instances.length, 3);
    assert.equal(training.instances.length, 3);
  });

  test("every linked instance belongs to the event's program", async () => {
    const rows = await repo().listProgramEvents({ includePast: true });
    const summit = rows.find((row) => row.event.id === "evt_mosaic_program_summit");
    const training = rows.find((row) => row.event.id === "evt_khidma_regional_training");
    assert.ok(summit);
    assert.ok(training);

    for (const linked of summit.instances) {
      assert.equal(linked.programId, summit.event.programId);
    }
    for (const linked of training.instances) {
      assert.equal(linked.programId, training.event.programId);
    }
  });

  test("regions are de-duplicated and match the linked instances' regions", async () => {
    const rows = await repo().listProgramEvents({ includePast: true });
    const summit = rows.find((row) => row.event.id === "evt_mosaic_program_summit");
    assert.ok(summit);

    const expectedRegionIds = new Set(summit.instances.map((linked) => linked.regionId));
    assert.equal(summit.regions.length, expectedRegionIds.size);
    assert.deepEqual(new Set(summit.regions.map((region) => region.id)), expectedRegionIds);
    assert.equal(summit.regions.length, 3);
  });
});

describe("filtering", () => {
  test("by program", async () => {
    const instances = await repo().listProgramInstanceSummaries({ programId: "prog_mosaic" });
    assert.equal(instances.length, 3);
    assert.ok(instances.every((summary) => summary.instance.programId === "prog_mosaic"));

    const events = await repo().listProgramEvents({ programId: "prog_mosaic", includePast: true });
    assert.equal(events.length, 3);
    assert.ok(events.every((row) => row.event.programId === "prog_mosaic"));
  });

  test("by cycle year", async () => {
    const instances = await repo().listProgramInstanceSummaries({ cycleYear: 2025 });
    assert.equal(instances.length, 2);
    assert.ok(instances.every((summary) => summary.instance.cycleYear === 2025));
    assert.deepEqual(
      instanceIds(instances).sort(),
      ["inst_olympia_games_2025_mw", "inst_roots_fall_2025_sw"].sort(),
    );
  });

  test("by region", async () => {
    const instances = await repo().listProgramInstanceSummaries({ regionId: "org_southwest" });
    assert.equal(instances.length, 6);
    assert.ok(instances.every((summary) => summary.instance.organizationId === "org_southwest"));
    assert.ok(instances.length < programInstances.length);
  });

  test("by lifecycle status", async () => {
    const instances = await repo().listProgramInstanceSummaries({ status: "planning" });
    assert.equal(instances.length, 6);
    assert.ok(instances.every((summary) => summary.instance.status === "planning"));
  });

  test("by event type", async () => {
    const events = await repo().listProgramEvents({ eventType: "orientation", includePast: true });
    assert.equal(events.length, 4);
    assert.ok(events.every((row) => row.event.eventType === "orientation"));
  });

  test("by date range on events", async () => {
    const events = await repo().listProgramEvents({
      from: "2026-10-01",
      to: "2026-10-31",
      includePast: true,
    });
    assert.equal(events.length, 4);
    for (const row of events) {
      const startDate = row.event.startsAt.slice(0, 10);
      assert.ok(startDate >= "2026-10-01" && startDate <= "2026-10-31", row.event.id);
    }
    assert.deepEqual(
      ids(events.map((row) => row.event)).sort(),
      [
        "evt_cpoi_training_sw",
        "evt_al_ummah_planning_meeting",
        "evt_embark_orientation_ne",
        "evt_roots_continuation_review",
      ].sort(),
    );
  });

  test("includePast excludes events before the reference date by default, and includes them when asked", async () => {
    const defaultEvents = await repo().listProgramEvents({ referenceDate: REFERENCE_DATE });
    for (const row of defaultEvents) {
      assert.ok(row.event.startsAt.slice(0, 10) >= REFERENCE_DATE.slice(0, 10), row.event.id);
    }
    assert.equal(defaultEvents.length, programEvents.length - 4);

    const allEvents = await repo().listProgramEvents({
      referenceDate: REFERENCE_DATE,
      includePast: true,
    });
    assert.equal(allEvents.length, programEvents.length);

    const pastOnly = [
      "evt_mosaic_orientation_sw",
      "evt_khidma_debrief_sw",
      "evt_olympia_orientation_ne",
      "evt_olympia_debrief_2025_mw",
    ];
    for (const id of pastOnly) {
      assert.ok(
        !ids(defaultEvents.map((row) => row.event)).includes(id),
        `${id} leaked into default`,
      );
      assert.ok(
        ids(allEvents.map((row) => row.event)).includes(id),
        `${id} missing with includePast`,
      );
    }
  });
});

describe("search", () => {
  test("matches on program name", async () => {
    const summaries = await repo().listProgramSummaries({ search: "leadership" });
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]?.program.id, "prog_mosaic");
    // A bare program-name match does not narrow instances.
    assert.equal(summaries[0]?.instances.length, 3);
  });

  test("matches on instance name, returning the program with only the matching instances", async () => {
    const summaries = await repo().listProgramSummaries({ search: "Fall Gathering 2025" });
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]?.program.id, "prog_roots");
    assert.deepEqual(instanceIds(summaries[0]?.instances ?? []), ["inst_roots_fall_2025_sw"]);
  });

  test("an instance-name search can select a subset of one program's instances", async () => {
    const summaries = await repo().listProgramSummaries({ search: "Service Weeks" });
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]?.program.id, "prog_khidma");
    assert.deepEqual(
      instanceIds(summaries[0]?.instances ?? []).sort(),
      ["inst_khidma_service_sw", "inst_khidma_spring_2027_ne"].sort(),
    );
  });

  test("is case-insensitive", async () => {
    const summaries = await repo().listProgramSummaries({ search: "MOSAIC" });
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]?.program.id, "prog_mosaic");
  });

  test("a term matching nothing returns an empty array", async () => {
    const summaries = await repo().listProgramSummaries({ search: "zzz-nonexistent-zzz" });
    assert.deepEqual(summaries, []);
  });
});

describe("deterministic sorting", () => {
  test("calling listProgramSummaries twice returns identically ordered ids", async () => {
    const first = await repo().listProgramSummaries({ referenceDate: REFERENCE_DATE });
    const second = await repo().listProgramSummaries({ referenceDate: REFERENCE_DATE });
    assert.deepEqual(
      ids(first.map((summary) => summary.program)),
      ids(second.map((summary) => summary.program)),
    );
    for (let index = 0; index < first.length; index += 1) {
      assert.deepEqual(
        instanceIds(first[index]?.instances ?? []),
        instanceIds(second[index]?.instances ?? []),
      );
    }
  });

  test("instances sort by start date then name, with null start dates last", async () => {
    const instances = await repo().listProgramInstanceSummaries({ programId: "prog_al_ummah" });
    assert.deepEqual(instanceIds(instances), [
      "inst_al_ummah_fall_national",
      "inst_al_ummah_winter_2027_mw",
    ]);
    assert.equal(instances[1]?.instance.startDate, null);
  });

  test("events sort ascending by startsAt", async () => {
    const rows = await repo().listProgramEvents({ includePast: true });
    const starts = rows.map((row) => row.event.startsAt);
    assert.deepEqual(starts, [...starts].sort());
  });
});

describe("not-found behaviour", () => {
  test("getProgram returns null for an unknown id", async () => {
    assert.equal(await repo().getProgram("nope"), null);
  });

  test("getProgramInstance returns null for an unknown instance id", async () => {
    assert.equal(await repo().getProgramInstance("prog_mosaic", "nope"), null);
  });

  test("getProgramDetail returns null for an unknown program id", async () => {
    assert.equal(await repo().getProgramDetail("nope"), null);
  });

  test("getProgramInstanceDetail returns null for an unknown instance id", async () => {
    assert.equal(await repo().getProgramInstanceDetail("prog_mosaic", "nope"), null);
  });
});

describe("wrong-parent rejection", () => {
  test("getProgramInstance rejects a real instance under the wrong program", async () => {
    const result = await repo().getProgramInstance("prog_embark", "inst_mosaic_summer_sw");
    assert.equal(result, null);
  });

  test("getProgramInstanceDetail rejects a real instance under the wrong program", async () => {
    const result = await repo().getProgramInstanceDetail("prog_embark", "inst_mosaic_summer_sw");
    assert.equal(result, null);
  });
});

describe("program detail shape", () => {
  test("current holds only in_progress instances", async () => {
    const detail = await repo().getProgramDetail("prog_olympia", { referenceDate: REFERENCE_DATE });
    assert.ok(detail);
    assert.deepEqual(instanceIds(detail.current), ["inst_olympia_games_ne"]);
    assert.ok(detail.current.every((summary) => summary.instance.status === "in_progress"));
  });

  test("upcoming holds in-flight-but-not-started instances, null start dates last", async () => {
    const detail = await repo().getProgramDetail("prog_khidma", { referenceDate: REFERENCE_DATE });
    assert.ok(detail);
    assert.deepEqual(instanceIds(detail.upcoming), [
      "inst_khidma_service_winter_mw",
      "inst_khidma_spring_2027_ne",
    ]);
    assert.ok(detail.upcoming.every((summary) => summary.instance.status !== "in_progress"));
  });

  test("completed holds completed/cancelled instances, most recent first", async () => {
    const detail = await repo().getProgramDetail("prog_roots", { referenceDate: REFERENCE_DATE });
    assert.ok(detail);
    assert.deepEqual(instanceIds(detail.completed), [
      "inst_roots_spring_ne",
      "inst_roots_fall_2025_sw",
    ]);
    assert.ok(
      detail.completed.every((summary) =>
        ["completed", "cancelled"].includes(summary.instance.status),
      ),
    );
  });

  test("readiness roll-up rows never report more entries for an area than there are signals", async () => {
    const detail = await repo().getProgramDetail("prog_mosaic", { referenceDate: REFERENCE_DATE });
    assert.ok(detail);

    const instanceIdsForProgram = new Set(
      programInstances
        .filter((instance) => instance.programId === "prog_mosaic")
        .map((instance) => instance.id),
    );
    const signalsForProgram = readinessSignals.filter((signal) =>
      instanceIdsForProgram.has(signal.programInstanceId),
    );

    for (const row of detail.readiness) {
      const signalsForArea = signalsForProgram.filter((signal) => signal.area === row.area);
      const totalCounted = Object.values(row.counts).reduce((sum, count) => sum + count, 0);
      assert.ok(totalCounted <= signalsForArea.length);
      assert.equal(totalCounted, signalsForArea.length);
    }

    const totalRolledUp = detail.readiness.reduce(
      (sum, row) => sum + Object.values(row.counts).reduce((rowSum, count) => rowSum + count, 0),
      0,
    );
    assert.equal(totalRolledUp, signalsForProgram.length);
  });

  test("readiness rows follow the domain's fixed area order", async () => {
    const detail = await repo().getProgramDetail("prog_mosaic", { referenceDate: REFERENCE_DATE });
    assert.ok(detail);
    const order = new Map(READINESS_AREAS.map((area, index) => [area, index]));
    const indexes = detail.readiness.map((row) => order.get(row.area) ?? -1);
    assert.deepEqual(
      indexes,
      [...indexes].sort((a, b) => a - b),
    );
  });
});

describe("instance detail readiness ordering", () => {
  test("getProgramInstanceDetail sorts readiness signals into the fixed area order", async () => {
    const detail = await repo().getProgramInstanceDetail("prog_mosaic", "inst_mosaic_fall_ne");
    assert.ok(detail);
    const order = new Map(READINESS_AREAS.map((area, index) => [area, index]));
    const indexes = detail.readiness.map((signal) => order.get(signal.area) ?? -1);
    assert.deepEqual(
      indexes,
      [...indexes].sort((a, b) => a - b),
    );
  });
});

describe("immutability", () => {
  test("mutating a returned program-summary array does not affect a later call", async () => {
    const repository = repo();
    const first = await repository.listProgramSummaries({ referenceDate: REFERENCE_DATE });
    (first as unknown[]).length = 0;

    const second = await repository.listProgramSummaries({ referenceDate: REFERENCE_DATE });
    assert.equal(second.length, programs.length);
  });

  test("mutating a program summary's instances array does not affect a later call", async () => {
    const repository = repo();
    const first = await repository.listProgramSummaries({ referenceDate: REFERENCE_DATE });
    const mosaicFirst = first.find((summary) => summary.program.id === "prog_mosaic");
    assert.ok(mosaicFirst);
    (mosaicFirst.instances as unknown[]).push("intruder");

    const second = await repository.listProgramSummaries({ referenceDate: REFERENCE_DATE });
    const mosaicSecond = second.find((summary) => summary.program.id === "prog_mosaic");
    assert.ok(mosaicSecond);
    assert.equal(mosaicSecond.instances.length, 3);
  });

  test("mutating listProgramEvents results does not affect a later call", async () => {
    const repository = repo();
    const first = await repository.listProgramEvents({ includePast: true });
    (first as unknown[]).length = 0;

    const second = await repository.listProgramEvents({ includePast: true });
    assert.equal(second.length, programEvents.length);
  });
});

describe("phase 1 compatibility", () => {
  test("getOverview still returns every section populated", async () => {
    const overview = await repo().getOverview({ referenceDate: REFERENCE_DATE });

    assert.ok(overview.portfolio.length > 0);
    assert.ok(overview.upcomingInstances.length > 0);
    assert.ok(overview.upcomingEvents.length > 0);
    assert.ok(overview.attention.length > 0);
    assert.ok(overview.complianceReadiness.length > 0);
    assert.ok(overview.financeWorkflow.length > 0);
    assert.ok(overview.recentActivity.length > 0);
    assert.ok(overview.integrations.length > 0);
  });

  test("listPrograms and listProgramInstances still behave", async () => {
    const repository = repo();
    const allPrograms = await repository.listPrograms();
    assert.equal(allPrograms.length, programs.length);

    const allInstances = await repository.listProgramInstances();
    assert.equal(allInstances.length, programInstances.length);

    const scoped = await repository.listProgramInstances({ programId: "prog_mosaic" });
    assert.equal(scoped.length, 3);
    assert.ok(scoped.every((instance) => instance.programId === "prog_mosaic"));
  });
});

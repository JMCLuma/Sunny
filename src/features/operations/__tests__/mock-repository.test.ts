import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { createMockOperationsRepository } from "../data";
import {
  auditEvents,
  financialRecords,
  people,
  programAssignments,
  programEvents,
  programInstances,
  programs,
  requirementAssignments,
  requirementDefinitions,
  tasks,
} from "../data/mock-data";

const REFERENCE_DATE = "2026-09-11T00:00:00.000Z";

describe("mock repository contract", () => {
  test("every method returns a promise", () => {
    const repository = createMockOperationsRepository();
    assert.ok(repository.getOverview() instanceof Promise);
    assert.ok(repository.listPrograms() instanceof Promise);
  });

  test("the overview fills every section", async () => {
    const overview = await createMockOperationsRepository().getOverview({
      referenceDate: REFERENCE_DATE,
    });

    assert.equal(overview.generatedAt, REFERENCE_DATE);
    assert.ok(overview.portfolio.length > 0);
    assert.ok(overview.upcomingInstances.length > 0);
    assert.ok(overview.upcomingEvents.length > 0);
    assert.ok(overview.attention.length > 0);
    assert.ok(overview.complianceReadiness.length > 0);
    assert.ok(overview.financeWorkflow.length > 0);
    assert.ok(overview.recentActivity.length > 0);
    assert.ok(overview.integrations.length > 0);
  });

  test("returned collections are copies, so a caller cannot corrupt the seed", async () => {
    const repository = createMockOperationsRepository();
    const first = await repository.listPrograms();
    (first as unknown[]).length = 0;

    const second = await repository.listPrograms();
    assert.equal(second.length, programs.length);
  });

  test("limit truncates without reordering", async () => {
    const repository = createMockOperationsRepository();
    const all = await repository.listPrograms();
    const limited = await repository.listPrograms({ limit: 3 });

    assert.equal(limited.length, 3);
    assert.deepEqual(
      limited.map((program) => program.id),
      all.slice(0, 3).map((program) => program.id),
    );
  });

  test("the organization filter narrows results", async () => {
    const repository = createMockOperationsRepository();
    const instances = await repository.listProgramInstances({ organizationId: "org_southwest" });

    assert.ok(instances.length > 0);
    assert.ok(instances.every((instance) => instance.organizationId === "org_southwest"));
    assert.ok(instances.length < programInstances.length);
  });
});

describe("upcoming and attention rules", () => {
  test("upcoming events are future, not cancelled, and date-ordered", async () => {
    const rows = await createMockOperationsRepository().listUpcomingProgramEvents({
      referenceDate: REFERENCE_DATE,
    });

    assert.ok(rows.length > 0);
    for (const row of rows) {
      assert.ok(row.event.startsAt >= REFERENCE_DATE, `${row.event.id} is not upcoming`);
      assert.notEqual(row.event.status, "cancelled");
    }
    const starts = rows.map((row) => row.event.startsAt);
    assert.deepEqual(starts, [...starts].sort());
  });

  test("attention tasks are unfinished, and overdue ones come first", async () => {
    const attention = await createMockOperationsRepository().listTasksRequiringAttention({
      referenceDate: REFERENCE_DATE,
    });

    assert.ok(attention.length > 0);
    for (const task of attention) {
      assert.ok(["open", "in_progress", "blocked"].includes(task.status));
    }

    const overdueFlags = attention.map(
      (task) => task.dueDate !== null && task.dueDate < REFERENCE_DATE.slice(0, 10),
    );
    const lastOverdue = overdueFlags.lastIndexOf(true);
    const firstNotOverdue = overdueFlags.indexOf(false);
    if (lastOverdue !== -1 && firstNotOverdue !== -1) {
      assert.ok(lastOverdue < firstNotOverdue, "an overdue task sorted after a non-overdue one");
    }
  });

  test("recent activity is newest first", async () => {
    const events = await createMockOperationsRepository().listRecentAuditEvents();
    const timestamps = events.map((event) => event.occurredAt);
    assert.deepEqual(timestamps, [...timestamps].sort().reverse());
  });
});

describe("overview aggregates", () => {
  test("compliance counts stay internally consistent", async () => {
    const overview = await createMockOperationsRepository().getOverview({
      referenceDate: REFERENCE_DATE,
    });

    for (const row of overview.complianceReadiness) {
      assert.ok(row.complete + row.outstanding <= row.assigned, `${row.requirementId} overcounts`);
      assert.ok(row.expiringSoon <= row.assigned);
      assert.ok(row.assigned >= 0);
    }
  });

  test("portfolio counts are derived from real instances and confirmed assignments", async () => {
    const overview = await createMockOperationsRepository().getOverview({
      referenceDate: REFERENCE_DATE,
    });

    for (const row of overview.portfolio) {
      assert.equal(row.program.status, "active");

      const instancesForProgram = programInstances.filter(
        (instance) => instance.programId === row.program.id,
      );
      assert.ok(row.activeInstances <= instancesForProgram.length);
      assert.ok(row.upcomingInstances <= instancesForProgram.length);

      const distinctConfirmed = new Set(
        programAssignments
          .filter(
            (assignment) =>
              assignment.programId === row.program.id && assignment.status === "confirmed",
          )
          .map((assignment) => assignment.personId),
      ).size;
      assert.equal(row.assignedPeople, distinctConfirmed);
    }
  });

  test("finance rows account for every financial record exactly once", async () => {
    const overview = await createMockOperationsRepository().getOverview({
      referenceDate: REFERENCE_DATE,
    });

    const counted = overview.financeWorkflow.reduce((total, row) => total + row.count, 0);
    assert.equal(counted, financialRecords.length);
  });
});

describe("seed data hygiene", () => {
  test("the expected programs are present", () => {
    assert.deepEqual(
      programs.map((program) => program.name).sort(),
      ["Al-Ilm", "Al-Ummah", "CPOI", "Embark", "Khidma", "Mosaic", "Olympia", "Roots"].sort(),
    );
  });

  test("every foreign key resolves", () => {
    const ids = {
      program: new Set(programs.map((program) => program.id)),
      instance: new Set(programInstances.map((instance) => instance.id)),
      person: new Set(people.map((person) => person.id)),
      requirement: new Set(requirementDefinitions.map((definition) => definition.id)),
    };

    for (const instance of programInstances) {
      assert.ok(ids.program.has(instance.programId), `${instance.id} -> ${instance.programId}`);
    }
    for (const event of programEvents) {
      assert.ok(ids.program.has(event.programId), event.id);
      for (const instanceId of event.programInstanceIds) {
        assert.ok(ids.instance.has(instanceId), event.id);
      }
    }
    for (const assignment of programAssignments) {
      assert.ok(ids.person.has(assignment.personId), assignment.id);
      assert.ok(ids.program.has(assignment.programId), assignment.id);
      assert.ok(ids.instance.has(assignment.programInstanceId), assignment.id);
    }
    for (const assignment of requirementAssignments) {
      assert.ok(ids.requirement.has(assignment.requirementId), assignment.id);
      assert.ok(ids.person.has(assignment.personId), assignment.id);
    }
    for (const task of tasks) {
      if (task.programId !== null) assert.ok(ids.program.has(task.programId), task.id);
      if (task.assignedToPersonId !== null) {
        assert.ok(ids.person.has(task.assignedToPersonId), task.id);
      }
    }
    for (const event of auditEvents) {
      if (event.actorPersonId !== null) assert.ok(ids.person.has(event.actorPersonId), event.id);
    }
  });

  test("people are obvious placeholders", () => {
    for (const person of people) {
      assert.match(person.displayName, /^Demo /, `${person.id} looks like a real name`);
    }
  });

  test("the seed file carries no contact details or identifiers", () => {
    // Guards the file itself: a future edit that pastes in a spreadsheet row
    // fails here rather than in review.
    const source = readFileSync(new URL("../data/mock-data.ts", import.meta.url), "utf8");
    const body = source.slice(source.indexOf("import type"));

    assert.doesNotMatch(body, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, "email address");
    assert.doesNotMatch(body, /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/, "phone number");
    assert.doesNotMatch(body, /\b\d{3}-\d{2}-\d{4}\b/, "government identifier");
    assert.doesNotMatch(body, /\b(dateOfBirth|dob|ssn|diagnosis|medication|allergy)\b/i, "PII key");
  });
});

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ChecklistEntry, ChecklistItemDefinition } from "@/features/operations/domain";

import {
  checklistGroupFor,
  countOverdue,
  dueLabel,
  groupChecklistEntries,
  isChecklistEntryOverdue,
  nextDeadline,
  parseChecklistSearch,
} from "../checklist-view";
import type { ChecklistView } from "@/features/operations/data";

function definition(overrides: Partial<ChecklistItemDefinition> = {}): ChecklistItemDefinition {
  return {
    id: "chk_test",
    programId: "prog_test",
    programInstanceId: "inst_test",
    kind: "custom",
    title: "Test item",
    description: null,
    icon: "list-checks",
    order: 1,
    dueDate: null,
    target: { kind: "none" },
    appliesToRoles: [],
    required: true,
    ...overrides,
  };
}

function entry(overrides: Partial<ChecklistEntry> = {}): ChecklistEntry {
  return {
    definition: definition(),
    progress: null,
    status: "not_started",
    dueDate: null,
    daysUntilDue: null,
    ...overrides,
  };
}

describe("parseChecklistSearch", () => {
  test("reads a string profile id", () => {
    assert.deepEqual(parseChecklistSearch({ profile: "prof_1" }), { profile: "prof_1" });
  });

  test("degrades a missing or malformed value to nothing, rather than throwing", () => {
    assert.deepEqual(parseChecklistSearch({}), {});
    assert.deepEqual(parseChecklistSearch({ profile: "" }), {});
    assert.deepEqual(parseChecklistSearch({ profile: 42 }), {});
    assert.deepEqual(parseChecklistSearch({ profile: null }), {});
  });
});

describe("checklistGroupFor / groupChecklistEntries", () => {
  test("action_needed and under_review land in different piles", () => {
    assert.equal(checklistGroupFor("action_needed"), "action");
    assert.equal(checklistGroupFor("under_review"), "waiting");
  });

  test("groups are returned in a fixed order and omit empty piles", () => {
    const entries = [entry({ status: "complete" }), entry({ status: "not_started" })];
    const groups = groupChecklistEntries(entries);
    assert.deepEqual(
      groups.map((group) => group.id),
      ["action", "done"],
    );
  });
});

describe("dueLabel", () => {
  test("a finished item reports when it was due, not how many days ago", () => {
    const label = dueLabel(entry({ status: "complete", dueDate: "2026-09-01", daysUntilDue: -5 }));
    assert.equal(label.tone, "normal");
    assert.match(label.text, /Was due/);
  });

  test("an overdue, unfinished item says how many days late", () => {
    const label = dueLabel(
      entry({ status: "not_started", dueDate: "2026-09-01", daysUntilDue: -3 }),
    );
    assert.equal(label.tone, "overdue");
    assert.equal(label.text, "3 days overdue");
  });

  test("no due date at all reports 'No deadline'", () => {
    assert.deepEqual(dueLabel(entry()), { text: "No deadline", tone: "none" });
  });
});

describe("isChecklistEntryOverdue / countOverdue", () => {
  test("overdue is only ever true for unfinished work", () => {
    const overdueButDone = entry({ status: "complete", daysUntilDue: -2, dueDate: "2026-09-01" });
    const overdueAndOpen = entry({
      status: "action_needed",
      daysUntilDue: -2,
      dueDate: "2026-09-01",
    });
    assert.equal(isChecklistEntryOverdue(overdueButDone), false);
    assert.equal(isChecklistEntryOverdue(overdueAndOpen), true);
  });

  test("countOverdue counts across a whole checklist view", () => {
    const view: ChecklistView = {
      profileId: "prof_1",
      profileName: "Demo Child",
      programInstanceId: "inst_1",
      programName: "Mosaic",
      instanceName: "Fall",
      entries: [
        entry({ status: "not_started", daysUntilDue: -1, dueDate: "2026-09-01" }),
        entry({ status: "complete", daysUntilDue: -1, dueDate: "2026-09-01" }),
        entry({ status: "in_progress", daysUntilDue: 5, dueDate: "2026-09-20" }),
      ],
      completed: 1,
      total: 3,
    };
    assert.equal(countOverdue(view), 1);
  });
});

describe("nextDeadline", () => {
  test("picks the single soonest outstanding deadline across every view", () => {
    const soon: ChecklistView = {
      profileId: "prof_soon",
      profileName: "Soon",
      programInstanceId: "inst_1",
      programName: "Mosaic",
      instanceName: "Fall",
      entries: [entry({ daysUntilDue: 2, dueDate: "2026-09-19" })],
      completed: 0,
      total: 1,
    };
    const later: ChecklistView = {
      profileId: "prof_later",
      profileName: "Later",
      programInstanceId: "inst_2",
      programName: "Al-Ummah",
      instanceName: "Fall",
      entries: [entry({ daysUntilDue: 20, dueDate: "2026-10-07" })],
      completed: 0,
      total: 1,
    };
    const result = nextDeadline([later, soon]);
    assert.equal(result?.view.profileId, "prof_soon");
  });

  test("returns null when nothing is outstanding", () => {
    const done: ChecklistView = {
      profileId: "prof_1",
      profileName: "Done",
      programInstanceId: "inst_1",
      programName: "Mosaic",
      instanceName: "Fall",
      entries: [entry({ status: "complete", daysUntilDue: -1 })],
      completed: 1,
      total: 1,
    };
    assert.equal(nextDeadline([done]), null);
  });
});

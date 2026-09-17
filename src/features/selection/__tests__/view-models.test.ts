import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { CriterionScore, RubricCriterion, ScoringRubric } from "@/features/operations/domain";
import {
  clampPoints,
  confirmationState,
  draftCriterionScores,
  maxWeightedTotal,
  summarizeInterviews,
  weightedTotal,
} from "../view-models";

const CRITERIA: readonly RubricCriterion[] = [
  {
    id: "crit_demo",
    rubricId: "rubric_x",
    kind: "demographic",
    label: "Demographic",
    description: null,
    maxPoints: 20,
    weight: 1,
    sourceQuestionId: null,
  },
  {
    id: "crit_essay",
    rubricId: "rubric_x",
    kind: "essay",
    label: "Essay",
    description: null,
    maxPoints: 30,
    weight: 1.5,
    sourceQuestionId: null,
  },
];

const RUBRIC: ScoringRubric = {
  id: "rubric_x",
  programId: "prog_x",
  programInstanceId: "inst_x",
  name: "Test rubric",
  version: 1,
  status: "active",
  criteria: CRITERIA,
};

describe("clampPoints", () => {
  test("clamps into range and rounds", () => {
    assert.equal(clampPoints(5.6, 20), 6);
    assert.equal(clampPoints(-5, 20), 0);
    assert.equal(clampPoints(999, 20), 20);
  });

  test("a non-finite keystroke is not a score", () => {
    assert.equal(clampPoints(Number.NaN, 20), 0);
  });
});

describe("weightedTotal / maxWeightedTotal", () => {
  test("applies each criterion's weight", () => {
    const scores: readonly CriterionScore[] = [
      { criterionId: "crit_demo", points: 10, note: null, aiSuggested: false },
      { criterionId: "crit_essay", points: 20, note: null, aiSuggested: true },
    ];
    // 10*1 + 20*1.5 = 40
    assert.equal(weightedTotal(scores, RUBRIC), 40);
    // 20*1 + 30*1.5 = 65
    assert.equal(maxWeightedTotal(RUBRIC), 65);
  });
});

describe("confirmationState", () => {
  test("an essay criterion pre-scored by the AI pass is not signed off", () => {
    const scores: readonly CriterionScore[] = [
      { criterionId: "crit_demo", points: 10, note: null, aiSuggested: false },
      { criterionId: "crit_essay", points: 20, note: null, aiSuggested: true },
    ];
    const state = confirmationState(scores);
    assert.equal(state.signedOff, false);
    assert.deepEqual(state.awaitingHuman, ["crit_essay"]);
    assert.equal(state.confirmed, 1);
  });

  test("once every criterion is confirmed, the state signs off", () => {
    const scores: readonly CriterionScore[] = [
      { criterionId: "crit_demo", points: 10, note: null, aiSuggested: false },
      { criterionId: "crit_essay", points: 20, note: null, aiSuggested: false },
    ];
    assert.equal(confirmationState(scores).signedOff, true);
  });
});

describe("draftCriterionScores", () => {
  test("an untouched rubric starts every criterion empty and unconfirmed", () => {
    const draft = draftCriterionScores(RUBRIC, undefined);
    assert.equal(draft.length, CRITERIA.length);
    for (const entry of draft) {
      assert.equal(entry.points, 0);
      assert.equal(entry.aiSuggested, false);
    }
  });

  test("an existing score is carried over as the starting draft", () => {
    const existing: readonly CriterionScore[] = [
      { criterionId: "crit_essay", points: 22, note: "good", aiSuggested: true },
    ];
    const draft = draftCriterionScores(RUBRIC, existing);
    const essay = draft.find((entry) => entry.criterionId === "crit_essay");
    assert.equal(essay?.points, 22);
    assert.equal(essay?.aiSuggested, true);
    const demo = draft.find((entry) => entry.criterionId === "crit_demo");
    assert.equal(demo?.points, 0);
  });
});

describe("summarizeInterviews", () => {
  test("carries the earliest purge date across every interview holding notes", () => {
    const summary = summarizeInterviews([
      {
        id: "i1",
        submissionId: "s1",
        interviewerPersonId: null,
        status: "completed",
        scheduledFor: null,
        meetingUrl: null,
        notes: "note",
        notesPurgeAfter: "2026-12-31",
      },
      {
        id: "i2",
        submissionId: "s2",
        interviewerPersonId: null,
        status: "completed",
        scheduledFor: null,
        meetingUrl: null,
        notes: "note",
        notesPurgeAfter: "2026-10-01",
      },
      {
        id: "i3",
        submissionId: "s3",
        interviewerPersonId: null,
        status: "scheduled",
        scheduledFor: null,
        meetingUrl: null,
        notes: null,
        notesPurgeAfter: null,
      },
    ]);

    assert.equal(summary.total, 3);
    assert.equal(summary.withNotes, 2);
    assert.equal(summary.earliestPurge, "2026-10-01");
  });
});

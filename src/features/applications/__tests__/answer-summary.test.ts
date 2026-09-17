import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ApplicationAnswer, ApplicationQuestion } from "@/features/operations/domain";

import { formatAnswerValue } from "../answer-summary";

function question(overrides: Partial<ApplicationQuestion>): ApplicationQuestion {
  return {
    id: "q_test",
    sectionId: "sec_test",
    type: "short_text",
    label: "Test question",
    helpText: null,
    required: false,
    order: 1,
    ...overrides,
  };
}

describe("formatAnswerValue", () => {
  test("an unanswered question reads as not answered", () => {
    assert.equal(formatAnswerValue(question({}), undefined), "Not answered");
    assert.equal(
      formatAnswerValue(question({}), { questionId: "q_test", value: null }),
      "Not answered",
    );
  });

  test("a boolean reads as Yes or No, not true/false", () => {
    const q = question({ type: "boolean" });
    assert.equal(formatAnswerValue(q, { questionId: "q_test", value: true }), "Yes");
    assert.equal(formatAnswerValue(q, { questionId: "q_test", value: false }), "No");
  });

  test("a coded select value reads back as its label", () => {
    const q = question({
      type: "select",
      options: [{ value: "ym", label: "Youth Medium" }],
    });
    assert.equal(formatAnswerValue(q, { questionId: "q_test", value: "ym" }), "Youth Medium");
  });

  test("a multi-select reads back as a joined list of labels", () => {
    const q = question({
      type: "multi_select",
      options: [
        { value: "counselor", label: "Counselor" },
        { value: "activity_lead", label: "Activity lead" },
      ],
    });
    const answer: ApplicationAnswer = {
      questionId: "q_test",
      value: ["counselor", "activity_lead"],
    };
    assert.equal(formatAnswerValue(q, answer), "Counselor, Activity lead");
  });

  test("a repeatable group reads back as a count, not its rows", () => {
    const q = question({ type: "repeatable_group" });
    const answer: ApplicationAnswer = { questionId: "q_test", value: [{ a: "1" }, { a: "2" }] };
    assert.equal(formatAnswerValue(q, answer), "2 entries");
  });

  test("a file upload reads back the file name, never the raw value", () => {
    const q = question({ type: "file_upload" });
    const answer: ApplicationAnswer = {
      questionId: "q_test",
      value: "blob:ignored",
      fileName: "resume.pdf",
    };
    assert.equal(formatAnswerValue(q, answer), "resume.pdf");
    assert.equal(formatAnswerValue(q, undefined), "No file attached");
  });
});

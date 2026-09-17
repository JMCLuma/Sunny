import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { MATCH_OUTCOMES, describeMatchOutcome } from "../match-outcomes";

describe("describeMatchOutcome", () => {
  test("every outcome has copy, and the copy names itself correctly", () => {
    for (const outcome of MATCH_OUTCOMES) {
      const copy = describeMatchOutcome(outcome);
      assert.equal(copy.outcome, outcome);
      assert.ok(copy.title.length > 0);
      assert.ok(copy.body.length > 0);
      assert.ok(copy.next.length > 0);
    }
  });

  test("the rule that matters: an uncertain or conflicting match withholds detail", () => {
    for (const outcome of ["uncertain", "conflict"] as const) {
      const copy = describeMatchOutcome(outcome);
      assert.notEqual(copy.withheld, null);
    }
  });

  test("a confirmed link or a fresh record reveals nothing to withhold", () => {
    for (const outcome of ["confirmed", "no_match"] as const) {
      assert.equal(describeMatchOutcome(outcome).withheld, null);
    }
  });

  test("withheld copy never leaks the kind of detail it says it withholds", () => {
    for (const outcome of ["uncertain", "conflict"] as const) {
      const withheld = describeMatchOutcome(outcome).withheld ?? "";
      // The whole point: no name, no region, no confidence number should ever
      // appear in copy that claims to withhold them.
      assert.doesNotMatch(withheld, /\d/);
    }
  });

  test("MATCH_OUTCOMES lists all four outcomes exactly once", () => {
    assert.equal(MATCH_OUTCOMES.length, 4);
    assert.deepEqual([...MATCH_OUTCOMES].sort(), [
      "confirmed",
      "conflict",
      "no_match",
      "uncertain",
    ]);
  });
});

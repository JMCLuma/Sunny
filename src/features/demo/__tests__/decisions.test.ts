import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { OPEN_DECISIONS, decisionsForRoute, getDecision } from "../decisions";

describe("open decisions", () => {
  test("ids are unique and resolvable", () => {
    const ids = OPEN_DECISIONS.map((decision) => decision.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.ok(getDecision(id));
    assert.equal(getDecision("not-a-decision"), null);
  });

  test("every decision names a question, an assumption and a source", () => {
    // The source is the load-bearing field: a decision without one is an
    // assertion, and the point of the panel is to show where each came from.
    for (const decision of OPEN_DECISIONS) {
      assert.ok(decision.question.endsWith("?"), `${decision.id} should ask a question`);
      assert.ok(decision.assumption.length > 20, decision.id);
      assert.ok(decision.source.length > 20, decision.id);
      assert.ok(decision.surfaces.length > 0, decision.id);
    }
  });

  test("the two decisions the team has not closed are marked as such", () => {
    assert.equal(getDecision("account-model")?.status, "assumed");
    assert.equal(getDecision("staff-scope")?.status, "open");
  });

  test("route matching is prefix-based but does not let / match everything", () => {
    assert.ok(decisionsForRoute("/my/apply").some((d) => d.id === "street-address"));
    assert.ok(decisionsForRoute("/my/household").some((d) => d.id === "minor-accounts"));

    // "/" is an exact match only; otherwise every decision scoped to the
    // landing page would surface on every page in the product.
    const landing = decisionsForRoute("/");
    const deep = decisionsForRoute("/operations/applications");
    assert.ok(landing.some((d) => d.id === "terminology"));
    assert.ok(!deep.some((d) => d.surfaces.includes("/") && d.surfaces.length === 1));
  });

  test("an unrelated route surfaces nothing", () => {
    assert.deepEqual(decisionsForRoute("/privacy"), []);
  });
});

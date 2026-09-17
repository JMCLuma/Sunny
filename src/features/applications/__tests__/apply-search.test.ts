import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseApplySearch } from "../apply-search";

describe("parseApplySearch", () => {
  test("keeps a well-formed profile id", () => {
    assert.deepEqual(parseApplySearch({ profile: "prof_demo_child_1" }), {
      profile: "prof_demo_child_1",
    });
  });

  test("drops a missing or blank value rather than trusting it", () => {
    assert.deepEqual(parseApplySearch({}), {});
    assert.deepEqual(parseApplySearch({ profile: "" }), {});
    assert.deepEqual(parseApplySearch({ profile: "   " }), {});
  });

  test("drops a non-string value instead of coercing it", () => {
    assert.deepEqual(parseApplySearch({ profile: 12 }), {});
    assert.deepEqual(parseApplySearch({ profile: null }), {});
  });

  test("caps an implausibly long value", () => {
    const huge = "x".repeat(500);
    const result = parseApplySearch({ profile: huge });
    assert.equal(result.profile?.length, 120);
  });
});

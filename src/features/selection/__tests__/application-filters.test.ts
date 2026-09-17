import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  isBlind,
  parseQueueSearch,
  parseReviewSearch,
  parseSelectionSearch,
  parseSubmissionSearch,
} from "../application-filters";

/**
 * URL parsing has to fail toward the safe state, not toward whatever a
 * hand-edited or stale link happens to say — especially `identified`, where
 * the safe default is blind.
 */

describe("parseQueueSearch", () => {
  test("drops unrecognised values instead of coercing them", () => {
    assert.deepEqual(
      parseQueueSearch({ status: "not_a_real_status", audience: "participant", q: "  " }),
      { audience: "participant" },
    );
  });

  test("never emits a key for an absent filter", () => {
    const search = parseQueueSearch({});
    assert.deepEqual(Object.keys(search), []);
  });
});

describe("isBlind", () => {
  test("defaults to blind for an absent, malformed or falsy value", () => {
    assert.equal(isBlind({}), true);
    assert.equal(isBlind({ identified: false }), true);
  });

  test("only an explicit true turns identification on", () => {
    assert.equal(isBlind({ identified: true }), false);
  });
});

describe("parseReviewSearch", () => {
  test("only the literal '1' or true flips identified on from a raw URL value", () => {
    assert.deepEqual(parseReviewSearch({ identified: "1" }), { identified: true });
    assert.deepEqual(parseReviewSearch({ identified: "yes" }), {});
    assert.deepEqual(parseReviewSearch({ identified: "true" }), {});
  });

  test("carries the submission and instance through untouched when valid strings", () => {
    assert.deepEqual(parseReviewSearch({ instance: "inst_x", submission: "sub_y" }), {
      instance: "inst_x",
      submission: "sub_y",
    });
  });
});

describe("parseSelectionSearch", () => {
  test("rejects a sort key or direction outside the known set", () => {
    assert.deepEqual(parseSelectionSearch({ sort: "shoe_size", dir: "sideways" }), {});
  });

  test("accepts a known sort/direction pair", () => {
    assert.deepEqual(parseSelectionSearch({ sort: "name", dir: "asc" }), {
      sort: "name",
      dir: "asc",
    });
  });
});

describe("parseSubmissionSearch", () => {
  test("carries only the identified flag, safe by default", () => {
    assert.deepEqual(parseSubmissionSearch({ identified: "1", extra: "ignored" }), {
      identified: true,
    });
    assert.deepEqual(parseSubmissionSearch({}), {});
  });
});

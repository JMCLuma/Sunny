import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Profile } from "@/features/operations/domain";

import { isPastDue, presentBackgroundCheckStatus, profileDisplayName } from "../view-models";

function profile(overrides: Partial<Profile>): Profile {
  return {
    id: "prof_test",
    accountId: "acct_test",
    personId: null,
    personLinkStatus: "verified",
    kind: "household_member",
    legalFirstName: "Demo",
    legalLastName: "Participant",
    preferredName: null,
    dateOfBirth: null,
    risingSecularGrade: null,
    risingRecGrade: null,
    schoolName: null,
    schoolType: null,
    languages: [],
    needsTranslator: false,
    ownAccountId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("profileDisplayName", () => {
  test("prefers a preferred name", () => {
    assert.equal(profileDisplayName(profile({ preferredName: "Demo P." })), "Demo P.");
  });

  test("falls back to the legal name", () => {
    assert.equal(profileDisplayName(profile({})), "Demo Participant");
  });
});

describe("isPastDue", () => {
  test("a date after the reference date is not past due", () => {
    assert.equal(isPastDue("2026-09-16T12:00:00.000Z", "2026-09-23"), false);
  });

  test("a date before the reference date is past due", () => {
    assert.equal(isPastDue("2026-09-30T12:00:00.000Z", "2026-09-23"), true);
  });

  test("the reference date itself is not yet past due", () => {
    assert.equal(isPastDue("2026-09-23T00:00:00.000Z", "2026-09-23"), false);
  });
});

describe("presentBackgroundCheckStatus", () => {
  test("carries a label for every status and nothing more specific", () => {
    assert.equal(presentBackgroundCheckStatus("in_progress"), "In progress");
    assert.equal(presentBackgroundCheckStatus("cleared"), "Cleared");
    assert.equal(presentBackgroundCheckStatus("consider"), "Under review");
  });
});

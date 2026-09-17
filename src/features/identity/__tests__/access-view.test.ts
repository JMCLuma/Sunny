import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type {
  PersonRelationship,
  Profile,
  RelationshipAccessGrant,
} from "@/features/operations/domain";

import { buildAccessView, isGrantLive } from "../access-view";

function profile(id: string, overrides: Partial<Profile> = {}): Profile {
  return {
    id,
    accountId: "acct_1",
    personId: null,
    personLinkStatus: "verified",
    kind: "household_member",
    legalFirstName: "Demo",
    legalLastName: id,
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

function relationship(overrides: Partial<PersonRelationship> = {}): PersonRelationship {
  return {
    id: "rel_1",
    fromProfileId: "prof_parent",
    toProfileId: "prof_child",
    kind: "parent",
    verification: "verified",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function grant(overrides: Partial<RelationshipAccessGrant> = {}): RelationshipAccessGrant {
  return {
    id: "grant_1",
    relationshipId: "rel_1",
    subjectProfileId: "prof_child",
    programId: null,
    actions: ["complete_forms"],
    grantedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

describe("isGrantLive", () => {
  test("a revoked grant is never live, regardless of its expiry date", () => {
    assert.equal(
      isGrantLive(grant({ revokedAt: "2026-02-01T00:00:00.000Z" }), "2026-01-15"),
      false,
    );
  });

  test("a grant with no expiry is live indefinitely", () => {
    assert.equal(isGrantLive(grant({ expiresAt: null }), "2099-01-01"), true);
  });

  test("expiry is inclusive of its own date and false the day after", () => {
    assert.equal(isGrantLive(grant({ expiresAt: "2026-06-01" }), "2026-06-01"), true);
    assert.equal(isGrantLive(grant({ expiresAt: "2026-06-01" }), "2026-06-02"), false);
  });
});

describe("buildAccessView", () => {
  test("reports both what is granted and what is deliberately withheld", () => {
    const profiles = [profile("prof_parent"), profile("prof_child")];
    const relationships = [relationship()];
    const grants = [grant({ actions: ["complete_forms", "view_payment_status"] })];

    const view = buildAccessView(profiles, relationships, grants, "2026-06-01");
    assert.equal(view.rows.length, 1);
    const row = view.rows[0];
    assert.ok(row);
    // Presentation order (`GRANTED_ACTIONS`), not the order they were granted in.
    assert.deepEqual(row.granted, ["view_payment_status", "complete_forms"]);
    assert.ok(row.withheld.includes("view_health"));
    assert.ok(row.withheld.includes("sign_waivers"));
    assert.ok(!row.withheld.includes("complete_forms"));
  });

  test("a relationship with no live grant is reported separately, never silently dropped", () => {
    const profiles = [profile("prof_parent"), profile("prof_child")];
    const relationships = [relationship({ id: "rel_2" })];
    const grants: readonly RelationshipAccessGrant[] = [];

    const view = buildAccessView(profiles, relationships, grants, "2026-06-01");
    assert.equal(view.rows.length, 0);
    assert.equal(view.ungranted.length, 1);
    assert.equal(view.ungranted[0]?.holderName, "Demo prof_parent");
  });

  test("a grant whose relationship no longer exists is dropped rather than shown as 'Unknown'", () => {
    const profiles = [profile("prof_child")];
    const relationships: readonly PersonRelationship[] = [];
    const grants = [grant()];

    const view = buildAccessView(profiles, relationships, grants, "2026-06-01");
    assert.equal(view.rows.length, 0);
  });

  test("an expired grant still appears, marked not live", () => {
    const profiles = [profile("prof_parent"), profile("prof_child")];
    const relationships = [relationship()];
    const grants = [grant({ expiresAt: "2026-01-01" })];

    const view = buildAccessView(profiles, relationships, grants, "2026-06-01");
    assert.equal(view.rows[0]?.live, false);
    // Expired means "not standing access" — the relationship should also
    // show up as ungranted, not just as a dead row.
    assert.equal(view.ungranted.length, 1);
  });
});

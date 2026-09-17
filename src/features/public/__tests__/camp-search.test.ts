import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { ageAt } from "@/features/operations/domain";

import { parseCampSearch, toEligibilitySubject, hasActiveCampFilters } from "../camp-search";
import { CAMPS, getCampProfile, campMonogram } from "../camp-catalogue";

describe("camp search parsing", () => {
  test("an empty query means no filters", () => {
    const search = parseCampSearch({});
    assert.deepEqual(search, { age: null, grade: null, regionId: null, interest: null });
    assert.equal(hasActiveCampFilters(search), false);
  });

  test("out-of-range numbers are clamped, not rejected", () => {
    // A hand-edited URL should narrow the list, never break the page.
    assert.equal(parseCampSearch({ age: "99" }).age, 30);
    assert.equal(parseCampSearch({ age: "-4" }).age, 4);
    assert.equal(parseCampSearch({ grade: "40" }).grade, 12);
  });

  test("unknown interests and malformed regions are dropped", () => {
    assert.equal(parseCampSearch({ interest: "underwater-basket-weaving" }).interest, null);
    assert.equal(parseCampSearch({ region: "'; drop table" }).regionId, null);
    assert.equal(parseCampSearch({ region: "org_southwest" }).regionId, "org_southwest");
  });

  test("garbage numbers become null rather than NaN", () => {
    assert.equal(parseCampSearch({ age: "banana" }).age, null);
  });
});

describe("subject derivation", () => {
  test("the derived date of birth reproduces the age the visitor typed", () => {
    // The engine measures from a date of birth; a visitor gives a number. The
    // round trip has to land exactly, or the filter lies by a year.
    const today = "2026-09-17";
    for (const age of [6, 13, 17, 25]) {
      const subject = toEligibilitySubject(parseCampSearch({ age: String(age) }), today);
      assert.equal(ageAt(subject.dateOfBirth, today), age, `age ${age}`);
    }
  });

  test("an anonymous visitor is assumed to be a first-timer", () => {
    // The generous reading: a first-timer-only camp stays visible rather than
    // vanishing for a family who may well qualify.
    assert.equal(toEligibilitySubject(parseCampSearch({}), "2026-09-17").hasAttendedBefore, false);
  });
});

describe("camp catalogue", () => {
  test("slugs are unique and resolvable", () => {
    const slugs = CAMPS.map((camp) => camp.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) assert.ok(getCampProfile(slug), slug);
  });

  test("an unknown slug resolves to null rather than throwing", () => {
    assert.equal(getCampProfile("not-a-camp"), null);
  });

  test('monograms drop the leading "Camp"', () => {
    assert.equal(campMonogram("Camp Mosaic"), "M");
    assert.equal(campMonogram("Al-Ummah"), "AU");
  });
});

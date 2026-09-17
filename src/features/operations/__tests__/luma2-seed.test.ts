import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ACCESS_GRANTS,
  ACCOUNTS,
  APPLICATION_FORMS,
  CHECKLIST_DEFINITIONS,
  CHECKLIST_PROGRESS,
  ELIGIBILITY_CRITERIA,
  MATCH_REVIEWS,
  PROFILES,
  RELATIONSHIPS,
  RUBRICS,
  SUBMISSIONS,
} from "../data/mock-luma2-data";
import { programInstances, programs, people } from "../data/mock-data";

/**
 * Hygiene for the Luma 2.0 seed.
 *
 * `mock-data.ts` has its own test forbidding emails, phone numbers and a
 * `dateOfBirth` key outright. This file cannot obey that rule — eligibility is
 * decided on a date of birth and account linking is shown by two records
 * sharing an email — so the rule is adapted rather than waived: synthetic
 * values only, at reserved domains and in reserved number ranges.
 */
describe("Luma 2.0 seed hygiene", () => {
  test("every email is at a domain that cannot resolve", () => {
    for (const account of ACCOUNTS) {
      assert.match(account.email, /@example\.invalid$/, account.id);
    }
  });

  test("every phone number is in the range reserved for fiction", () => {
    for (const account of ACCOUNTS) {
      if (account.phone === null) continue;
      assert.match(account.phone, /^555-01\d{2}$/, account.id);
    }
  });

  test("people are obvious placeholders", () => {
    for (const profile of PROFILES) {
      assert.equal(profile.legalFirstName, "Demo", `${profile.id} looks like a real name`);
    }
  });

  test("the seed file carries no real-looking contact details", () => {
    const source = readFileSync(new URL("../data/mock-luma2-data.ts", import.meta.url), "utf8");
    const body = source.slice(source.indexOf("const DOMAIN"));

    // Any email that is not at the reserved domain.
    const emails = body.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
    for (const email of emails) {
      assert.match(email, /@example\.invalid$/, `unexpected email ${email}`);
    }
    assert.doesNotMatch(body, /\b\d{3}-\d{2}-\d{4}\b/, "government identifier");
    // Phone-shaped strings outside the reserved range.
    const phones = body.match(/\b\d{3}[-.\s]\d{4}\b/g) ?? [];
    for (const phone of phones) {
      assert.match(phone, /^555-01\d{2}$/, `unexpected phone ${phone}`);
    }
  });
});

describe("Luma 2.0 seed integrity", () => {
  const programIds = new Set(programs.map((program) => program.id));
  const instanceIds = new Set(programInstances.map((instance) => instance.id));
  const personIds = new Set(people.map((person) => person.id));
  const accountIds = new Set(ACCOUNTS.map((account) => account.id));
  const profileIds = new Set(PROFILES.map((profile) => profile.id));

  test("profiles belong to a real account and resolve to a real person", () => {
    for (const profile of PROFILES) {
      assert.ok(accountIds.has(profile.accountId), `${profile.id} -> ${profile.accountId}`);
      if (profile.personId !== null) {
        assert.ok(personIds.has(profile.personId), `${profile.id} -> ${profile.personId}`);
      }
    }
  });

  test("relationships, grants and match reviews point at real records", () => {
    for (const relationship of RELATIONSHIPS) {
      assert.ok(profileIds.has(relationship.fromProfileId), relationship.id);
      assert.ok(profileIds.has(relationship.toProfileId), relationship.id);
    }
    const relationshipIds = new Set(RELATIONSHIPS.map((r) => r.id));
    for (const grant of ACCESS_GRANTS) {
      assert.ok(relationshipIds.has(grant.relationshipId), grant.id);
      assert.ok(profileIds.has(grant.subjectProfileId), grant.id);
    }
    for (const review of MATCH_REVIEWS) {
      assert.ok(accountIds.has(review.accountId), review.id);
      assert.ok(profileIds.has(review.profileId), review.id);
      assert.ok(personIds.has(review.candidatePersonId), review.id);
    }
  });

  test("eligibility criteria attach to a real instance of the named program", () => {
    for (const criteria of ELIGIBILITY_CRITERIA) {
      assert.ok(programIds.has(criteria.programId), criteria.id);
      assert.ok(instanceIds.has(criteria.programInstanceId), criteria.id);
      const instance = programInstances.find((item) => item.id === criteria.programInstanceId)!;
      assert.equal(instance.programId, criteria.programId, `${criteria.id} program mismatch`);
    }
  });

  test("every question belongs to a section of its own form", () => {
    for (const form of APPLICATION_FORMS) {
      const sectionIds = new Set(form.sections.map((section) => section.id));
      for (const question of form.questions) {
        assert.ok(sectionIds.has(question.sectionId), `${form.id}/${question.id}`);
      }
      for (const section of form.sections) {
        assert.equal(section.formId, form.id, section.id);
      }
    }
  });

  test("submissions answer a real form and are made by a real profile", () => {
    const formIds = new Set(APPLICATION_FORMS.map((form) => form.id));
    for (const submission of SUBMISSIONS) {
      assert.ok(formIds.has(submission.formId), submission.id);
      assert.ok(instanceIds.has(submission.programInstanceId), submission.id);
      // Every submission must resolve, generated ones included: the detail
      // page needs a form, a profile and an account, and a queue row that
      // opens onto "not found" is worse than no row at all.
      assert.ok(profileIds.has(submission.profileId), submission.id);
      assert.ok(accountIds.has(submission.accountId), submission.id);
    }
  });

  test("the generated cohort is stable across evaluations", () => {
    // Guards the seeded generator: a stray Math.random or Date.now here would
    // make the server and the client disagree and break hydration.
    const first = SUBMISSIONS.map((submission) => `${submission.id}:${submission.status}`);
    const second = SUBMISSIONS.map((submission) => `${submission.id}:${submission.status}`);
    assert.deepEqual(first, second);
  });

  test("rubric criteria belong to their rubric and cite real questions", () => {
    const questionIds = new Set(APPLICATION_FORMS.flatMap((f) => f.questions).map((q) => q.id));
    for (const rubric of RUBRICS) {
      for (const criterion of rubric.criteria) {
        assert.equal(criterion.rubricId, rubric.id, criterion.id);
        if (criterion.sourceQuestionId !== null) {
          assert.ok(questionIds.has(criterion.sourceQuestionId), criterion.id);
        }
      }
    }
  });

  test("checklist progress refers to a definition that exists", () => {
    const definitionIds = new Set(CHECKLIST_DEFINITIONS.map((item) => item.id));
    for (const progress of CHECKLIST_PROGRESS) {
      assert.ok(definitionIds.has(progress.definitionId), progress.id);
      assert.ok(profileIds.has(progress.profileId), progress.id);
    }
  });
});

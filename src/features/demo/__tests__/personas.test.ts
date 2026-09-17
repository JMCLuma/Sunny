import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createAuthorizationService } from "@/features/operations/auth";
import { OPERATIONS_MODULES } from "@/features/operations/navigation";

import { DEFAULT_PERSONA_ID, DEMO_PERSONAS, getPersona, isPersonaId } from "../personas";

/**
 * The persona switcher is the demo's main instrument, so what each persona can
 * and cannot reach is a behaviour worth pinning down. These assertions are the
 * claims the presenter makes out loud — if one breaks, the demo starts lying.
 */

function modulesFor(personaId: string): readonly string[] {
  const service = createAuthorizationService(getPersona(personaId).actor);
  return service.filterAuthorized(OPERATIONS_MODULES).map((module) => module.id);
}

describe("persona catalogue", () => {
  test("ids are unique and every persona resolves", () => {
    const ids = DEMO_PERSONAS.map((persona) => persona.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.equal(getPersona(id).id, id);
  });

  test("an unknown id falls back rather than throwing", () => {
    // A hand-edited cookie must not be able to break every page.
    assert.equal(getPersona("nonsense").id, DEFAULT_PERSONA_ID);
    assert.equal(getPersona(null).id, DEFAULT_PERSONA_ID);
    assert.equal(isPersonaId("nonsense"), false);
  });

  test("family personas carry an account, staff personas do not", () => {
    for (const persona of DEMO_PERSONAS) {
      if (persona.surface === "family") {
        assert.ok(persona.accountId, `${persona.id} needs a household to sign in to`);
      } else {
        assert.equal(persona.accountId, null, `${persona.id} should not hold a household`);
      }
    }
  });
});

describe("what each persona can reach", () => {
  test("a family member holds no Operations permissions at all", () => {
    // Not "a few read-only grants" — none. Everything a parent may do comes
    // from a relationship and an access grant on a named child instead.
    for (const id of ["parent", "adult_participant", "staff_applicant"]) {
      assert.deepEqual(modulesFor(id), [], id);
      assert.deepEqual(getPersona(id).actor.grants, [], id);
    }
  });

  test("the senior admin reaches every module", () => {
    assert.equal(modulesFor("senior_admin").length, OPERATIONS_MODULES.length);
  });

  test("a camp lead sees their own camp's modules and no finance", () => {
    const modules = modulesFor("camp_lead");
    assert.ok(modules.includes("applications"));
    assert.ok(modules.includes("people"));
    assert.ok(!modules.includes("finance"), "a camp lead has no finance grant");
    assert.ok(!modules.includes("vendors"));
  });

  test("a reviewer may score but never decide", () => {
    const service = createAuthorizationService(getPersona("reviewer").actor);
    assert.ok(
      service.can({
        resource: "applications",
        action: "update",
        scope: "program",
        programId: "prog_mosaic",
      }),
      "reviewer should be able to score",
    );
    assert.equal(
      service.can({
        resource: "applications",
        action: "approve",
        scope: "program",
        programId: "prog_mosaic",
      }),
      false,
      "reviewer must not be able to approve a decision",
    );
  });

  test("a program-scoped persona cannot reach another program", () => {
    const service = createAuthorizationService(getPersona("camp_lead").actor);
    assert.ok(service.canAccessProgram("prog_mosaic"));
    assert.equal(service.canAccessProgram("prog_embark"), false);
  });

  test("the national team is region-scoped, not unlimited", () => {
    const service = createAuthorizationService(getPersona("npt").actor);
    assert.ok(
      service.can({
        resource: "applications",
        action: "view",
        scope: "region",
        organizationId: "org_southwest",
      }),
    );
    assert.equal(
      service.can({
        resource: "applications",
        action: "view",
        scope: "region",
        organizationId: "org_northeast",
      }),
      false,
      "a Southwest grant must not answer a Northeast question",
    );
    // Region outranks program, so the module door still opens and the
    // narrowing happens inside.
    assert.ok(modulesFor("npt").includes("applications"));
  });

  test("nobody holds a grant the permission catalogue does not define", () => {
    // A typo in a grant should fail closed, and this is where it surfaces.
    const service = createAuthorizationService(getPersona("senior_admin").actor);
    assert.equal(
      service.can({
        // @ts-expect-error — deliberately unknown resource
        resource: "payroll",
        action: "view",
        scope: "all",
      }),
      false,
    );
  });
});

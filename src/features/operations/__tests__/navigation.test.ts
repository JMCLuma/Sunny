import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { findModuleByRouteIds, getOperationsModule, OPERATIONS_MODULES } from "../navigation";

describe("module registry", () => {
  test("covers every Operations route and nothing else", () => {
    assert.deepEqual(
      OPERATIONS_MODULES.map((module) => module.path),
      [
        "/operations",
        "/operations/programs",
        "/operations/applications",
        "/operations/people",
        "/operations/finance",
        "/operations/compliance",
        "/operations/vendors",
        "/operations/risk",
        "/operations/documents",
        "/operations/insights",
        "/operations/marketing",
        "/operations/admin",
      ],
    );
  });

  test("ids, paths and route ids are unique", () => {
    for (const key of ["id", "path", "routeId"] as const) {
      const values = OPERATIONS_MODULES.map((module) => module[key]);
      assert.equal(new Set(values).size, values.length, `duplicate ${key}`);
    }
  });

  test("every module states a label and a one-sentence purpose", () => {
    for (const module of OPERATIONS_MODULES) {
      assert.ok(module.label.length > 0, `${module.id} has no label`);
      assert.ok(module.purpose.trim().endsWith("."), `${module.id} purpose is not a sentence`);
    }
  });

  test("getOperationsModule rejects an unknown id", () => {
    assert.throws(
      // @ts-expect-error — deliberately passing an id outside the union.
      () => getOperationsModule("payroll"),
      /Unknown Operations module/,
    );
  });
});

describe("active module resolution", () => {
  test("picks the deepest matched route", () => {
    const module = findModuleByRouteIds(["__root__", "/operations", "/operations/finance"]);
    assert.equal(module?.id, "finance");
  });

  test("falls back to the overview on the layout's index route", () => {
    const module = findModuleByRouteIds(["__root__", "/operations", "/operations/"]);
    assert.equal(module?.id, "overview");
  });

  test("returns null outside the Operations module", () => {
    assert.equal(findModuleByRouteIds(["__root__", "/_public", "/_public/"]), null);
  });
});

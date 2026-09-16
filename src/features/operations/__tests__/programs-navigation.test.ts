import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  findModuleByRouteIds,
  getOperationsModule,
  OPERATIONS_MODULES,
  resolveOperationsPage,
} from "../navigation";
import {
  parseEventsSearch,
  parseProgramsSearch,
  hasActiveProgramsFilters,
} from "../program-filters";

describe("Programs route configuration", () => {
  test("the Programs module still owns /operations/programs", () => {
    const programs = getOperationsModule("programs");
    assert.equal(programs.path, "/operations/programs");
    assert.equal(programs.access.resource, "programs");
    assert.equal(programs.access.action, "view");
  });

  test("every module gate asks only for some access, not blanket access", () => {
    // Module entry must not require the `all` scope, or a regional actor could
    // never open a module they legitimately have a slice of.
    for (const module of OPERATIONS_MODULES) {
      assert.equal(module.access.scope, "any", module.id);
    }
  });

  test("nested Programs routes still resolve to the Programs module", () => {
    const nested = [
      "/operations/programs/",
      "/operations/programs/events",
      "/operations/programs/$programId",
      "/operations/programs/$programId/",
      "/operations/programs/$programId/instances/$instanceId",
    ];

    for (const routeId of nested) {
      const module = findModuleByRouteIds(["__root__", "/operations", routeId]);
      assert.equal(module?.id, "programs", routeId);
    }
  });

  test("the overview is not claimed by a deeper module", () => {
    assert.equal(findModuleByRouteIds(["__root__", "/operations", "/operations/"])?.id, "overview");
    assert.equal(findModuleByRouteIds(["__root__", "/_public", "/_public/"]), null);
  });
});

describe("breadcrumbs and page title", () => {
  test("a module root shows the module name and its purpose", () => {
    const page = resolveOperationsPage([
      { routeId: "__root__" },
      { routeId: "/operations" },
      { routeId: "/operations/programs/" },
    ]);

    assert.deepEqual(
      page.crumbs.map((crumb) => crumb.label),
      ["Operations", "Programs"],
    );
    assert.equal(page.title, "Programs");
    assert.equal(page.description, getOperationsModule("programs").purpose);
    // The final crumb is the current page, so it must not be a link.
    assert.equal(page.crumbs[page.crumbs.length - 1]?.target, undefined);
    assert.notEqual(page.crumbs[0]?.target, undefined);
  });

  test("a route contributes its own crumb without building the trail", () => {
    const page = resolveOperationsPage([
      { routeId: "__root__" },
      { routeId: "/operations" },
      {
        routeId: "/operations/programs/events",
        loaderData: { crumb: { label: "Event schedule" } },
      },
    ]);

    assert.deepEqual(
      page.crumbs.map((crumb) => crumb.label),
      ["Operations", "Programs", "Event schedule"],
    );
    assert.equal(page.title, "Event schedule");
    assert.equal(page.description, null);
  });

  test("an instance page keeps the program crumb linked and itself current", () => {
    const page = resolveOperationsPage([
      { routeId: "__root__" },
      { routeId: "/operations" },
      {
        routeId: "/operations/programs/$programId",
        loaderData: {
          crumb: { label: "Mosaic", target: { kind: "program", programId: "prog_mosaic" } },
        },
      },
      {
        routeId: "/operations/programs/$programId/instances/$instanceId",
        loaderData: { crumb: { label: "Mosaic Summer 2026" } },
      },
    ]);

    assert.deepEqual(
      page.crumbs.map((crumb) => crumb.label),
      ["Operations", "Programs", "Mosaic", "Mosaic Summer 2026"],
    );
    assert.equal(page.title, "Mosaic Summer 2026");
    assert.deepEqual(page.crumbs[2]?.target, { kind: "program", programId: "prog_mosaic" });
    assert.equal(page.crumbs[3]?.target, undefined);
  });

  test("loader data without a usable crumb is ignored rather than trusted", () => {
    const page = resolveOperationsPage([
      { routeId: "/operations" },
      { routeId: "/operations/programs/", loaderData: { crumb: { label: 42 } } },
      { routeId: "/operations/programs/events", loaderData: "not an object" },
    ]);

    assert.deepEqual(
      page.crumbs.map((crumb) => crumb.label),
      ["Operations", "Programs"],
    );
  });
});

describe("URL filter parsing", () => {
  test("recognised values survive a round trip", () => {
    assert.deepEqual(
      parseProgramsSearch({
        q: " mosaic ",
        year: "2026",
        region: "org_southwest",
        status: "planning",
      }),
      { q: "mosaic", year: 2026, region: "org_southwest", status: "planning" },
    );
  });

  test("unknown or malformed values are dropped, not coerced", () => {
    assert.deepEqual(parseProgramsSearch({ status: "definitely_not_a_status" }), {});
    assert.deepEqual(parseProgramsSearch({ year: "not-a-year" }), {});
    assert.deepEqual(parseProgramsSearch({ year: 1200 }), {});
    assert.deepEqual(parseProgramsSearch({ q: "   " }), {});
    assert.deepEqual(parseProgramsSearch({}), {});
    assert.equal(hasActiveProgramsFilters(parseProgramsSearch({ junk: "x" })), false);
  });

  test("event filters parse the same way", () => {
    assert.deepEqual(parseEventsSearch({ type: "summit", program: "prog_mosaic", year: 2027 }), {
      program: "prog_mosaic",
      year: 2027,
      type: "summit",
    });
    assert.deepEqual(parseEventsSearch({ type: "banquet" }), {});
  });

  test("a long search term is truncated rather than passed through", () => {
    const parsed = parseProgramsSearch({ q: "x".repeat(500) });
    assert.equal(parsed.q?.length, 120);
  });
});

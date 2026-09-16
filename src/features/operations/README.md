# Luma Operations

The Operations module is a separate admin area at `/operations`.

**Phase 1** built the structure: route architecture, domain model,
authorization abstraction, data-repository abstraction, sanitized mock data, a
working overview screen and placeholders for the remaining modules.

**Phase 2** replaced the Programs placeholder with a read-only Programs module:
programs, their instances, the events that serve them, regions, and an
operational readiness view.

**Still not built:** real authentication, Supabase tables or migrations,
database access, external integrations, uploads, payments, rosters, forms, or
any production workflow. Nothing here writes data anywhere.

## Layout

```
src/features/operations/
  auth/          authorization vocabulary, service, mock actor, route guard
  components/    Operations chrome + presentational pieces (no data access)
  data/          repository contract, sanitized seed data, mock implementation
  domain/        pure TypeScript types shared by every module
  pages/         screen-level components; take data as props
  navigation.ts  the module registry (label, path, icon, permission) and the
                 breadcrumb/title assembly used by the shell
  program-filters.ts  URL search-parameter parsing for the Programs screens
  format.ts      date/currency formatting, locale- and timezone-pinned
  runtime.ts     composition root — the only file that picks implementations
```

Routes live under `src/routes/operations/` and stay thin: they guard access,
load data through the repository, and render a page component.

## Routes

| Route                                        | Renders                                                  |
| -------------------------------------------- | -------------------------------------------------------- |
| `/operations`                                | layout — sidebar, mobile menu, breadcrumbs, account menu |
| `/operations` (index)                        | Operations overview, from `repository.getOverview()`     |
| `/operations/programs` … `/operations/admin` | module placeholders                                      |

The public site now sits under the pathless `_public` layout route, which is
the only place `SiteHeader` is rendered. `__root.tsx` holds the app shell and
providers, nothing visual. No component inspects the URL to decide what chrome
to draw.

## Authorization

`AuthorizationService` (`auth/types.ts`) is the only thing routes and
components talk to. It answers `can()`, `explain()`, `canAccessProgram()` and
`filterAuthorized()` against an `Actor` carrying `PermissionGrant`s, each at a
scope: `all`, `region`, `program`, `assigned_program` or `self`.

Rules that hold today and must keep holding:

- **Deny by default.** An unknown resource, action or permission is denied, as
  is a request the actor holds no grant for, and one outside a grant's scope.
- **A request with no stated scope is held to `all`** — forgetting to narrow a
  question cannot accidentally widen access.
- **Hiding navigation is not protection.** Sidebar filtering and each route's
  `beforeLoad` read the same `access` object from `navigation.ts`, and the
  route check runs on the server during SSR and again on client navigation.
- **Page components never import the mock actor.** They receive the service
  through route context and `useAuthorization()`.
- **A module gate is not a content check.** A module's `access` uses the
  `any` scope — "does this actor hold Programs access at all?" — so a
  region-scoped user can open Programs. What they then see is narrowed by
  `createProgramAccessPolicy` in the route loader. `any` is a _required_
  scope only; no grant can be written at it, and unknown resources, actions
  and permissions stay denied.

### Programs scoping

`auth/program-access.ts` turns grants into the three questions Programs asks,
and `auth/program-visibility.ts` applies them to repository results before a
page renders:

- an **all-program** actor sees everything;
- a **program-scoped** actor sees that program, its instances and its events;
- a **region-scoped** actor sees instances in the granted region, reaches a
  program only through such an instance, and sees a shared event only through
  a linked instance they may see — with the other links trimmed off the row;
- an actor with no Programs grant sees nothing and is refused at the route.

Counts are recomputed from the visible subset, so "3 sessions" always means
three the actor can open. A denied detail route resolves to a not-found rather
than a message confirming the record exists.

## Repository

`OperationsRepository` (`data/repository.ts`) is the only way the UI reads
data. Every method is async even though the mock resolves immediately, so
adding real I/O later changes no call sites. Route loaders call it; page
components take the result as a prop and import no seed arrays.

## Programs model

- A **Program** is the ongoing identity of an offering. It is never recreated
  per year, region or session. Lifecycle: `active | inactive | archived`.
- A **ProgramInstance** is one delivery — a year, session, region, cohort or
  combination. Lifecycle: `planning | applications_open | confirmed |
in_progress | completed | cancelled`. Dates and location may be `null` while
  undecided, and `datesConfirmed` distinguishes a commitment from a working
  assumption. No fees, contracts, confidential records or participant detail
  live on an instance.
- A **ProgramEvent** belongs to exactly one program and links to any number of
  that program's instances via `programInstanceIds`. One training serving three
  regional deliveries is **one** event with three links, never three copies.
- A **Region** is an `Organization` with `kind: "region"`, and `RegionId` is
  that organization's id. There is deliberately no second geography table: the
  id an instance carries is the id the authorization `region` scope compares
  against and the id a future RLS policy will match on.
- **Readiness** is a view model. Each `ReadinessSignal` says how one area
  (`schedule`, `venue`, `applications`, `staffing`, `training`, `compliance`,
  `travel`) is tracking and nothing more. Finance, Vendors, Compliance and
  People stay the systems of record; their detail must never be copied here.

## Where Supabase connects later

- **Auth** — `runtime.ts` builds the actor. Replace `DEMO_ADMINISTRATOR` with
  one resolved from the Supabase session: `auth.users.id` → `UserAccountReference`
  → `Person` → that person's grants. The runtime is built per navigation, never
  cached at module scope, so a server render cannot reuse another request's
  actor.
- **Permissions** — grants move from a constant to rows. `createAuthorizationService`
  keeps its signature.
- **Row Level Security** — the real enforcement boundary. Policies key off the
  same scopes modelled here (`all`, `region`, `program`, `assigned_program`,
  `self`), so a request that gets past a client-side check still returns no
  rows. Client checks stay as UI gating only.
- **Data** — implement `OperationsRepository` against Supabase and swap it in
  `runtime.ts`. Pages do not change. The Programs reads live in the same
  contract (`ProgramsRepository`, which `OperationsRepository` extends) rather
  than a parallel service, so there is one interface to reimplement.

## Data handling

`data/mock-data.ts` is synthetic. It contains no real people, no email
addresses, phone numbers or addresses, no health information, no
background-check results, no payment details and no incident narratives.
Confidential material is deliberately absent from the shared domain types too:
`Incident` carries a neutral reference and status only, `Person` is an index
card, and `DocumentRecord` holds metadata without file contents. Keep it that
way — these records are visible to everything that can read the module.

## Tests

`bun test` runs the suite in `__tests__/` (Bun's runner, using the `node:test`
API — no extra dependency). It covers authorization defaults and scope
handling, Programs scoping for all-program/program-scoped/region-scoped and
unauthorized actors, the route guard, the module registry and breadcrumb
assembly, URL filter parsing, the mock repository's filtering, sorting and
not-found behaviour, and seed-data hygiene.

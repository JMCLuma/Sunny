# Sunny — the Luma 2.0 demo wireframe

A branded, clickable prototype of **Luma 2.0**, the platform merging Jubilee
Monuments Corporation's two current systems — Luma 1.0 (public site, family
portal, health review, onsite medical, finance) and IUSA 2.0 (applications,
prioritization scoring, selection decisions) — into one.

It runs on invented data. Nothing here is production code, and nothing it does
reaches a real system.

## What it is for

The merged BRD describes nineteen domains and the backlog carries 404 stories.
Against that, the real build is early, and the 09-09 call spent most of its
time re-deciding the shape of a single form. This exists so there is something
to look at: leadership can walk the product and react to it, and the
development team gets screens and a data contract to build against rather than
a document to interpret.

Where a decision was genuinely open, the wireframe makes one, says so, and
records where the question came from — see the **Open decisions** panel in the
bar at the bottom of any page.

## Running it

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev
```

Then open the app and use the **Viewing as** switcher in the bar at the bottom
to move between a parent, an applicant, a reviewer, a camp lead, the national
team, and a senior administrator. Permissions are real: some personas are
refused on some pages, which is the point.

`DEMO.md` is a presenter's script. `WIREFRAME.md` is the route index and an
honest account of what is real and what is drawn.

```sh
bun test          # domain logic, authorization scoping, seed integrity
bun run lint
bunx tsc --noEmit
bun run build
```

## Relationship to the real repository

Built on the Operations foundation from `JMCLuma/luma` (branch
`feature/luma-programs`), so the conventions match and screens can be lifted
back across. The mock repository in `src/features/operations/data/` doubles as
the data contract: implementing `OperationsRepository` against Supabase should
require no changes to any page component.

This repository is **not** connected to Lovable and has no deploy pipeline. Do
not point it at the production Supabase project.

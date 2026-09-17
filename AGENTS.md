# Working in this repository

Sunny is the **Luma 2.0 demo wireframe** — a clickable prototype on invented
data, built so JMC can see the merged platform before it exists. Read
`README.md` first, then `WIREFRAME.md` for what is real and what is drawn.

## Architecture

The structure comes from `JMCLuma/luma` and is documented in
`src/features/operations/README.md`. **Read that before changing anything.** In
short:

- `src/features/*/domain/` — pure types, no React, no I/O.
- `src/features/operations/data/repository.ts` — the single data contract.
  Every screen reads through it. Page components never import seed arrays,
  never call `fetch`, and never know where the answer came from.
- `src/features/operations/auth/` — scoped authorization, deny by default.
  Hiding navigation is not protection: the sidebar and each route's
  `beforeLoad` read the same `access` object.
- `src/features/*/pages/` — screen components that take data as props.
- `src/routes/` — file-based routes (TanStack Start). Thin: guard, load,
  render. See `src/routes/README.md` for the naming conventions.

Three surfaces, each with its own layout route and its own chrome: the public
site (`_public`), My Luma (`/my`), and Operations (`/operations`). No component
inspects the URL to decide what chrome to draw.

## Rules that are load-bearing

- **Mock data stays synthetic.** No real names, emails, phone numbers,
  addresses, health information or background-check results — ever, including
  from a spreadsheet someone exported. Two tests enforce this
  (`mock-repository.test.ts` and `luma2-seed.test.ts`); if one fails, the fix
  is to change the data, not the test.
- **Nothing may be non-deterministic in a render or seed path.** No
  `Math.random()`, no `Date.now()`. The server and the client must produce
  identical markup, and the generated applicant cohort is seeded for exactly
  this reason.
- **Works at 360px.** The BRD requires it and families are on phones. Use
  logical properties (`ms-`, `me-`, `start-`, `end-`) — the platform supports
  RTL for Farsi, Arabic and Urdu.
- **Semantic colour tokens only** (`bg-card`, `text-muted-foreground`, …),
  never hard-coded hex. The palette is defined once in `src/styles.css`.
- `src/routeTree.gen.ts` is generated. Never edit it by hand.

## Model policy for parallel agents

**The orchestrating session is the only Opus agent.** Subagents are picked by
the kind of work, not by default:

| Work                                                  | Model                                 |
| ----------------------------------------------------- | ------------------------------------- |
| Orchestration, architecture, integration              | Claude Opus 5 (`claude-opus-5`)       |
| Building — writing features, pages, non-trivial logic | Claude Fable 5.1 (`claude-fable-5-1`) |
| Research, search, review, light or mechanical tasks   | Claude Sonnet 5 (`claude-sonnet-5`)   |

The cost is real and worth knowing before reaching for the top row. Per
million tokens: Sonnet 5 is $2/$10, Opus 5 is $5/$25, Fable 5.1 is $10/$50.
Fable is the most expensive model available — above Opus tier, five times
Sonnet — so it is chosen for output quality on build work, never as a
default. Anything that is mostly reading, searching or following a written
contract goes to Sonnet.

Concurrency is the other half of the rule. Five concurrent Opus subagents
once exhausted the session limit mid-build and terminated together, losing a
day. Keep parallel build agents few, give each a disjoint set of files, and
make sure the contract they build against is written before they start —
recovering a rate-limited agent's work is only possible because its logic
was already committed to disk.

## Comments

The code carries more explanation than usual, deliberately: this repository is
a specification as much as a program, and the reasoning behind a decision is
often the thing worth keeping. Comments say **why**, not what. A comment that
restates the line below it should be deleted.

## This is not production

No Supabase project, no Cloudflare target, no secrets, no deploy workflow, and
no Lovable connection. CI runs lint, typecheck, tests and a build. Do not add a
deploy step and do not point this repository at production infrastructure.

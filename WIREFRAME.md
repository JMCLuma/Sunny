# What is real, and what is drawn

Sunny looks like a product. It is not one. This page is the honest account of
where the line falls, so nobody plans against something that does not exist.

Read it alongside `DEMO.md`, which is the presenter's script.

---

## Real

These behave the way the finished system would, and the code is worth keeping.

**The authorization model.** `src/features/operations/auth/` implements scoped,
deny-by-default permissions: `all` › `region` › `program` / `assigned_program`
› `self`. Every route guard and the navigation filter read the same `access`
object, so they cannot drift apart. The persona switcher exercises it for real
— the reviewer and parent personas are genuinely refused at `/operations`, and
the camp lead genuinely sees five modules instead of twelve. Nothing is
special-cased for the demo.

**The eligibility engine.** `src/features/operations/domain/eligibility.ts` is
a working rule evaluator, unit-tested. Criteria are a _set_ of rules and an
applicant matching any one qualifies, which is what lets "ages 15–17 **or**
rising sophomore through senior" be two rules rather than a special case. This
was the sticking point on the 09-09 call and it is solved here.

**The data contract.** `src/features/operations/data/repository.ts` is the only
way any screen reads or writes. It is written to be implemented against
Supabase without touching a single page component — that is the main artefact
the development team should take from this repository.

**The domain model.** Account / Profile / Person kept separate; relationship
kept separate from access grant; background-check _status_ modelled without the
report behind it. The reasoning is in the header comments of each file in
`src/features/operations/domain/`, and those comments are the point as much as
the types are.

---

## Drawn

These look finished and are not.

**All data is invented.** Every person, camp session, application, score and
deadline is synthetic. Emails are at `@example.invalid`, phone numbers are in
the 555-01xx range reserved for fiction, and names are all "Demo …". Two tests
enforce this. Nothing here came from a real export and nothing ever should.

**Nothing persists.** Writes — saving a draft, submitting, recording a decision
— land in an in-memory overlay. They survive navigation within a session and
reset when the browser reloads. That is deliberate: an overlay restored from
browser storage would make the first client render disagree with the server's
and risk a hydration error mid-demo, and a reset between run-throughs is
useful. **Do not demo save-and-resume across a page refresh — it will not
work.**

**No back end at all.** No Supabase project, no database, no migrations, no
authentication, no row-level security. The persona switcher is a cookie, not a
session. There is no Stripe, Resend, Sterling, Calendly, QuickBooks or SMS
integration, and no AI actually grades anything — AI-suggested scores are
seeded values flagged as unconfirmed to show where a human sign-off belongs.

**No email, no notifications, no exports.** Buttons that would send or download
say so.

**Finance, health review and onsite medical are shells.** Luma 1.0 already
implements these in production — 74 pages, 92 tables, 77 edge functions — and
the merge carries them forward unchanged. Re-specifying them here would be
invention, not design. They exist so a presenter can walk the whole product
without hitting a dead end.

**Translation is not wired.** The language menu changes its own label and
nothing else. Eight locales with RTL for Farsi, Arabic and Urdu are a real
requirement; the layout uses logical properties throughout so RTL will work,
but no strings are translated.

---

## Decisions this wireframe had to make

Several things had to be settled to draw a screen at all, and the team has not
agreed them. Each is recorded in `src/features/demo/decisions.ts` and surfaced
in the **Open decisions** panel on the screens it affects — tagged _decided_,
_assumed_, or _still open_.

The two that matter most:

**The account model** is _assumed_, not decided. This wireframe builds one
login holding a household of profiles — the model Zain demonstrated from IUSA
on the 09-09 call and Sunny endorsed. The Person-Linking document recommends
the opposite: one account per adult, with guardians reaching minors through
verified relationships. The call did not close it. A `Person` record is kept
underneath the profiles here, which is what would make either answer
survivable, but the surface is built one way and that choice is visible in
every family screen.

**Staff applications** are _in scope here_ and were out of scope on the call.
Ahil's universal application covered participants only; the merged BRD makes
volunteer applications, Sterling checks and a separate state machine core to
the same domain. This wireframe builds both on one engine. If the team means to
defer staff, that is less work, not more — but it should be an explicit
decision rather than a discovery.

Everything else — terminology, eligibility authority, whether camps may be
capped on added questions, health-record retention, cross-camp visibility,
interview scope, minimum age for a login — is in the panel.

---

## Where the requirements came from

| Source                                    | What it settled                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Luma 2.0 Merged BRD`                     | The nineteen domains, roles and tiers, state machines, non-functional requirements                       |
| `Luma 2 User Creation and Person Linking` | Account / Person / access separation, matching outcomes, guardian model                                  |
| `luma-user-stories.xlsx` (404 stories)    | Luma 1.0's shipped behaviour, carried forward                                                            |
| 09-09 call transcript                     | The application's structure and the trim feedback; the account model; eligibility filtering; terminology |
| `JMC 2026 Program Tracker`                | Real program names, event types, age bands and fees behind the seed data                                 |
| `JMCLuma/luma` @ `feature/luma-programs`  | The architecture, design system and Operations foundation this is built on                               |

## Where Supabase connects

`src/features/operations/README.md` has the detail. In short: `runtime.ts` is
the composition root and the only file that picks implementations. Replace the
demo persona with an actor built from a Supabase session, swap the mock
repository for one reading real tables, and add row-level security keyed off
the same scopes already modelled here. No page component changes.

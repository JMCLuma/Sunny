# Demo script

A guided walk for one presenter, about 15 minutes. Every route below works
today; the persona switcher is in the bar at the bottom of every page.

Before you start: **reload the page**. Anything filled in during a previous
run-through lives in memory only and clears on refresh, which gives you a
clean deck.

---

## 0. Frame it (30 seconds)

> This is a wireframe on invented data. Nothing is saved and nothing connects
> to a real system. What it is for is to stop us re-deciding the same things
> every fortnight — so where we hadn't agreed something, it makes a choice and
> tells you which choice it made.

Point at the bar along the bottom. **Open decisions** is how it tells you.

---

## 1. A family arrives — Find My Camp (2 min)

Go to **`/camps`**.

Thirty camps is too many to read through. Type an age:

- **7** → 3 camps open
- **13** → 4 camps
- **16** → 6 camps

> The camps that don't fit don't vanish — they grey out and say why. "This camp
> is for rising 7th–9th grade." A camp that silently disappears generates a
> support email; one that explains itself doesn't.

This is the same eligibility engine the signed-in side uses. Nobody gets told
one thing before they register and another after.

Open **`/camps/mosaic`**. Eligibility is stated in words, not implied by an age
badge — because "ages 15–17 **or** rising sophomore through senior" is two
rules, and a badge can only show one.

---

## 2. One household, several children (3 min)

Switch persona to **Parent**. Go to **`/my`**.

> One login holds the household. The children are profiles under it, and you
> apply _as_ a profile. This is the model from the 9 September call.

Show **`/my/household`**. Two children with deliberately different eligibility,
and a third in `pending_match` — a teenager who signed up separately and whose
record we think, but do not know, is already ours.

> Notice the relationship and what the relationship _allows_ are listed
> separately. Being a child's emergency contact says who you are. It does not
> say you may sign their waivers.

---

## 3. The application (4 min) — the centrepiece

Go to **`/my/apply`**. Pick a child. You see only camps that child can attend.

> This is the eight-Mosaic problem. A family in Houston could see every Mosaic
> in the country and apply to all of them. Now they see theirs.

Open the application. Walk the three steps:

- **Step one is almost entirely pre-filled.** The profile already knows this;
  you confirm it. That is where most of the original length went.
- **Typeahead, not an 85-item dropdown**, for Jamatkhana.
- **Repeatable rows are capped.** Somebody will otherwise enter five hundred.
- **The progress bar turns green per section** as you complete it.
- **No street address.** Nothing used it. The health form collects one later,
  where there is a reason to hold it.

Leave mid-form and come back: the draft resumes where you left off.

---

## 4. The staff side of the same form (1 min)

Switch to **Staff applicant**, go to **`/my/applications`**.

Same engine, different audience: role selection, a resume, and a background
check. The application is accepted but cannot be onboarded until the check
clears.

> We show the check's _status_. We never show what it found. Almost nobody
> needs to know that, and the system shouldn't make it possible to leak.

---

## 5. Who gets in (4 min)

Switch to **Camp lead**. Go to **`/operations/applications`**.

Fifty-three applications. Filter by region, status, age.

**`/operations/applications/review`** — blind review. The applicant's name is
replaced by a reference while you score.

> Essay scores arrive pre-filled by the AI pass, flagged as unconfirmed. A
> human has to sign for them. Nothing here is decided by a machine on its own.

**`/operations/applications/selection`** — the cohort against capacity, by
region and by status. Select several and accept them in one action.

> Accepting sets a confirm-by date. Miss it and the place moves to the
> waitlist automatically — that's what makes a waitlist mean anything.

---

## 6. Permissions are real (1 min)

Still on a selection screen, switch to **Reviewer**.

The decision actions are gone — that persona may score but not decide. Now try
**`/operations`** as **Parent**: refused outright.

> That isn't the menu hiding links. The route guard itself is refusing, using
> the same permission model that will key the database policies later.

Switch to **National team**: every camp, but only the Southwest. Counts are
recomputed, so "twelve applications" always means twelve you can open.

---

## 7. What happens to everything else (1 min)

Open **`/operations/finance`**.

> Finance, health review and onsite medical already run in production in Luma
> 1.0 — 74 pages, 92 tables. The merge carries them forward unchanged, so this
> wireframe doesn't redraw them. Each module says where it runs today and what
> 2.0 changes.

---

## 8. Close on the open questions (1 min)

Open the **Open decisions** panel.

> Two matter most. The account model — households of profiles versus one
> account per adult — is _assumed_, not agreed; the call didn't close it.
> And staff applications are built here but were out of scope on the call.
>
> If we settle those two, the rest of this can be built against.

---

## If something goes wrong

- A page looks stale → reload; state is in memory.
- A persona seems stuck → the switcher reloads the page; give it a second.
- Nothing saved after a refresh → expected. See `WIREFRAME.md`.

---
name: style-guide
description: "Luma / JMC Camp Application design system - colors, typography, buttons, forms, header, footer, and dark mode conventions from styles.css and apply.html"
disable-model-invocation: false
---

# Luma / JMC Camp Application - Style Guide

This document summarizes the design system established in `styles.css` and
`apply.html`, for reference when building additional pages (e.g. the main
landing page).

## Files to reuse

- **`styles.css`** - the full stylesheet. Link it in any new page with:
  `<link rel="stylesheet" href="styles.css">`
- **`apply.html`** - reference implementation showing the header, buttons,
  form patterns, and JS conventions in context.

## Colors (CSS variables, defined in `:root`)

| Variable | Hex | Use |
|---|---|---|
| `--green` | `#007041` | Primary actions, headings, form accents |
| `--red` | `#B83D26` | Required-field asterisks only |
| `--orange` | `#D97707` | Focus rings, hover states |
| `--yellow` | `#F3BE44` | Nav-bar buttons, progress-bar current step |
| `--sky` | `#84BFCA` | Secondary accents |
| `--gray` | `#4F4F4F` | Body text, labels |
| `--white` | `#FFFFFF` | Card backgrounds |
| `--black` | `#000000` | Masthead border |
| `--mint` | `#DBF0E9` | Callout/note backgrounds |
| `--gray-light` | `#E9E9E9` | Borders, dividers |
| `--page-bg` | `#FAF9F3` | Page background |
| `--green-tint` | `#EAF3EE` | Secondary-button hover |

A few supporting values are not yet named variables: `#005c35` (primary
button hover), `#A6A6A6` (placeholder text). Consider promoting these to
variables if reused elsewhere.

## Typography

- **Font:** Gotham (embedded as base64 `@font-face` in `styles.css` - Book,
  Medium, and Bold weights). Fallback stack: `'Helvetica Neue', Arial,
  sans-serif`.
- Body text: `0.92-1rem`
- Headings scale with `clamp()` for responsiveness.

## Header / navigation (`header.site-header`)

- White background, bottom border, `position: sticky; top: 0;` so it stays
  pinned while scrolling.
- Brand mark (icon) + "Luma" / "by Jubilee Monuments Corp." text.
- Nav pills (`.nav-pill`): solid yellow background, orange on hover, fixed
  height (`38px`) and `min-width` (`108px`) so all buttons match regardless
  of content (icon vs. text-only).

## Footer (`footer.site-footer`)

Lives entirely in `styles.css` (not page-specific `<style>` blocks) so any
page can use it just by linking the stylesheet and pasting in the markup.

- Full-width bar (`--page-bg` background, top border) containing a
  centered, `max-width: 1100px` inner wrapper (`.footer-inner`).
- Three-column "table" layout (`.footer-columns`, equal-width `1fr 1fr 1fr`
  grid):
  - **Brand column** (`.footer-brand`) - logo + "Luma" wordmark
    (`.footer-brand-top`) and address (`.footer-address`).
  - **Explore column** (`.footer-col-explore`) and **Legal column**
    (`.footer-col-legal`) - both fully centered, each with a
    `.footer-heading` label (uppercase, muted) and a `.footer-links` list.
- Below the columns: `.footer-divider` (a plain `<hr>`) and
  `.footer-copyright`.
- Below 700px, columns stack into a single centered column.
- Dark mode needs no special-casing - every color uses shared variables
  which flip automatically via `html[data-theme="dark"]` rules.

## Dark mode

Real, not just a placeholder button. `html[data-theme="dark"]` selectors in
`styles.css` re-point `--page-bg`, `--gray`, `--gray-light`, `--mint`, and
`--green-tint` to dark-safe values; `--green`, `--white`, `--yellow`, etc.
stay fixed on purpose. A small script toggles `data-theme` on `<html>` from
the header's `#theme-toggle` button and remembers the choice in `localStorage`.
Any new page needs both the toggle button markup (in the header) and that
script to support dark mode - copy both from `apply.html` or `index.html`
rather than reimplementing.

If you build a custom section with its own fixed background (like the
homepage hero or the sign-in page's green panel), it will **not**
automatically adapt to dark mode unless you use the shared variables. That's
fine for intentionally "branded" panels that should look the same in both
themes, but pick fixed vs. variable-driven colors deliberately.

## Buttons

- `.btn-primary` - solid green, white text, used for Continue/Submit.
- `.btn-secondary` - white background, green border/text, used for
  Back/Save/Add-another actions.
- `.nav-pill` - yellow pill-shaped nav buttons (see above).

## Form patterns

- `.row` (grid) with variants `.two-col`, `.name-row`, `.name-pair-row`,
  `.city-state-zip`, `.dob-row` - each defines its own
  `grid-template-columns`. Always use one of these variants; a bare `.row`
  with only 1fr is fine for single full-width fields.
- `.radio-group` / `.checkbox-group` with `.option-grid` modifier for
  3-column grid layouts of options.
- "Other, please specify" pattern: a trigger radio/checkbox with an adjacent
  disabled text input, enabled via JS only when that specific option is
  selected (see `hear-about-other-trigger` for the reference implementation).
- Required-group validation: mark exactly one option per group with
  `required` (radio) or `data-group-required="true"` (checkbox) - the
  page-completion JS logic looks for these markers.

## Known constraints / gotchas

- The `[hidden]` attribute must always resolve to `display: none` - there's
  a global rule enforcing this (`[hidden] { display: none !important; }`)
  because component-specific `display` rules can otherwise override it.
- Labels do not truncate text (no `white-space: nowrap` globally) - long
  labels wrap naturally. Some specific rows reserve extra label height so
  multi-column inputs stay vertically aligned when a label wraps.
- Save/Resume uses browser `localStorage` - this is per-device/per-browser,
  not synced anywhere.
- **Generic element selectors carry hidden assumptions from `apply.html`.**
  Bare `main { padding: ... }` and `form { background: var(--white); ... }`
  rules exist to space out and card-ify the application form specifically.
  Any new page that reuses a bare `<main>` or `<form>` element for a
  different layout (e.g. a full-bleed hero, a split sign-in screen) will
  silently inherit that padding/background unless it's explicitly reset
  with a more specific class selector.

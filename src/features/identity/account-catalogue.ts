/**
 * Catalogue values the account form offers.
 *
 * The Jamatkhana list is here rather than behind the repository because the
 * contract does not expose one yet — the seed keeps its own copy for the
 * application form's typeahead, unexported. Duplicating a dozen labels is the
 * cheaper mistake of the two available: reaching into an application form to
 * read its options would tie onboarding to a form id that changes yearly.
 *
 * When this is real there are roughly eighty-five of them and they belong to
 * the same table regions come from, reached through `OperationsRepository`.
 * The labels below match the seed's exactly, so an account onboarded here and
 * an account seeded there hold the same string.
 */
export interface JamatkhanaOption {
  readonly value: string;
  readonly label: string;
  /** The region it sits in. Shown so two similarly named places are separable. */
  readonly region: string;
}

export const JAMATKHANAS: readonly JamatkhanaOption[] = [
  { value: "sw_hq", label: "Southwest — Headquarters", region: "Southwest" },
  { value: "sw_principal", label: "Southwest — Principal", region: "Southwest" },
  { value: "sw_sugarland", label: "Southwest — Sugar Land", region: "Southwest" },
  { value: "sw_plano", label: "Southwest — Plano", region: "Southwest" },
  { value: "ne_central", label: "Northeast — Central", region: "Northeast" },
  { value: "ne_darkhana", label: "Northeast — Darkhana", region: "Northeast" },
  { value: "ne_boston", label: "Northeast — Boston", region: "Northeast" },
  { value: "mw_lakeside", label: "Midwest — Lakeside", region: "Midwest" },
  { value: "mw_northshore", label: "Midwest — North Shore", region: "Midwest" },
  { value: "mw_glenview", label: "Midwest — Glenview", region: "Midwest" },
];

/**
 * Typeahead matching.
 *
 * Matches on the label *and* the region, so typing "boston" and typing
 * "northeast" both get somewhere — a parent who knows their region but not the
 * building's formal name is the common case. An empty query returns the whole
 * list rather than nothing, because a list of ten is worth just browsing.
 *
 * The em dash in every label is why this normalizes rather than comparing
 * directly: nobody types one.
 */
export function filterJamatkhanas(
  query: string,
  options: readonly JamatkhanaOption[] = JAMATKHANAS,
): readonly JamatkhanaOption[] {
  const needle = normalize(query);
  if (needle.length === 0) return options;
  return options.filter((option) =>
    `${normalize(option.label)} ${normalize(option.region)}`.includes(needle),
  );
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Two-letter US state code, or nothing. Keeps a typo out of the record. */
export function isPlausibleStateCode(value: string): boolean {
  return /^[A-Za-z]{2}$/.test(value.trim());
}

/** Five digits, or five plus four. ZIP is the coarsest geography collected. */
export function isPlausiblePostalCode(value: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(value.trim());
}

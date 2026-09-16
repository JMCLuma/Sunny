import type { Actor, PermissionGrant } from "@/features/operations/auth";
import type { Id } from "@/features/operations/domain";

/**
 * The people a presenter can "be" while walking the demo.
 *
 * ## Why this exists
 *
 * Luma 2.0's hardest ideas are all about who sees what: a region-scoped
 * reviewer, a camp lead who may decide for their camp and no other, a parent
 * who may act for their own children only. Describing that in a slide never
 * lands. Switching to the persona and watching the navigation, the roster and
 * the refusals change does.
 *
 * So these are not cosmetic labels. Each persona carries real
 * `PermissionGrant`s at real scopes, and the same authorization service that
 * guards every route evaluates them. When the reviewer persona cannot open
 * Finance, that is the deny-by-default rule firing, not a hidden link.
 *
 * `DEMO_ADMINISTRATOR` in `features/operations/auth/mock-actor.ts` remains the
 * default: the persona list is a superset built the same way, and both
 * disappear together when Supabase Auth lands.
 */

/** Which part of the product a persona is meant to demonstrate. */
export type PersonaSurface = "family" | "operations";

export interface DemoPersona {
  readonly id: PersonaId;
  readonly label: string;
  /** One line on what this persona is for, shown in the switcher. */
  readonly summary: string;
  readonly surface: PersonaSurface;
  readonly actor: Actor;
  /** Set for family personas: the account whose household they sign in to. */
  readonly accountId: Id | null;
}

export type PersonaId =
  | "parent"
  | "adult_participant"
  | "staff_applicant"
  | "reviewer"
  | "camp_lead"
  | "npt"
  | "senior_admin";

const NATIONAL_ORG = "org_national";
const SOUTHWEST_REGION = "org_southwest";

/** Stable ids shared with the identity seed, so personas resolve to real rows. */
export const DEMO_ACCOUNTS = {
  parentHousehold: "acct_demo_household_1",
  adultParticipant: "acct_demo_adult_1",
  staffApplicant: "acct_demo_staff_applicant_1",
} as const;

const DEMO_PEOPLE = {
  parent: "person_9",
  adultParticipant: "person_7",
  staffApplicant: "person_1",
  reviewer: "person_5",
  campLead: "person_3",
  npt: "person_4",
  seniorAdmin: "person_6",
} as const;

/**
 * A family member holds no Operations permissions at all.
 *
 * Not "a few read-only grants" — none. Everything a parent may do, they may do
 * because a relationship and an access grant say so for a named child, which
 * the portal checks separately. Their route guards refuse Operations outright,
 * which is the behaviour worth showing.
 */
const FAMILY_GRANTS: readonly PermissionGrant[] = [];

/** Scores applications for one program, and sees nothing else. */
const REVIEWER_GRANTS: readonly PermissionGrant[] = [
  { permission: "applications.view", scope: "program", programIds: ["prog_mosaic"] },
  { permission: "applications.update", scope: "program", programIds: ["prog_mosaic"] },
  { permission: "programs.view", scope: "program", programIds: ["prog_mosaic"] },
];

/** Decides for their own camp. Note the absence of any cross-camp grant. */
const CAMP_LEAD_GRANTS: readonly PermissionGrant[] = [
  { permission: "operations.view", scope: "program", programIds: ["prog_mosaic"] },
  { permission: "applications.view", scope: "program", programIds: ["prog_mosaic"] },
  { permission: "applications.update", scope: "program", programIds: ["prog_mosaic"] },
  { permission: "applications.approve", scope: "program", programIds: ["prog_mosaic"] },
  { permission: "programs.view", scope: "program", programIds: ["prog_mosaic"] },
  { permission: "programs.update", scope: "program", programIds: ["prog_mosaic"] },
  { permission: "people.view", scope: "program", programIds: ["prog_mosaic"] },
  { permission: "compliance.view", scope: "program", programIds: ["prog_mosaic"] },
];

/**
 * National team: every program, but within one region.
 *
 * The interesting persona. A `region` grant outranks `program` but is still
 * narrower than `all`, so this actor opens Programs and Applications freely
 * and then sees only the Southwest — counts included, which is why the
 * repository recomputes them from the visible subset rather than reporting
 * totals a user cannot drill into.
 */
const NPT_GRANTS: readonly PermissionGrant[] = [
  { permission: "operations.view", scope: "region", organizationIds: [SOUTHWEST_REGION] },
  { permission: "programs.view", scope: "region", organizationIds: [SOUTHWEST_REGION] },
  { permission: "programs.update", scope: "region", organizationIds: [SOUTHWEST_REGION] },
  { permission: "applications.view", scope: "region", organizationIds: [SOUTHWEST_REGION] },
  { permission: "applications.update", scope: "region", organizationIds: [SOUTHWEST_REGION] },
  { permission: "applications.approve", scope: "region", organizationIds: [SOUTHWEST_REGION] },
  { permission: "applications.manage", scope: "region", organizationIds: [SOUTHWEST_REGION] },
  { permission: "people.view", scope: "region", organizationIds: [SOUTHWEST_REGION] },
  { permission: "compliance.view", scope: "region", organizationIds: [SOUTHWEST_REGION] },
  { permission: "insights.view", scope: "region", organizationIds: [SOUTHWEST_REGION] },
];

const SENIOR_ADMIN_GRANTS: readonly PermissionGrant[] = [
  { permission: "operations.view", scope: "all" },
  { permission: "programs.view", scope: "all" },
  { permission: "programs.manage", scope: "all" },
  { permission: "applications.view", scope: "all" },
  { permission: "applications.update", scope: "all" },
  { permission: "applications.approve", scope: "all" },
  { permission: "applications.manage", scope: "all" },
  { permission: "applications.export", scope: "all" },
  { permission: "people.view", scope: "all" },
  { permission: "people.manage", scope: "all" },
  { permission: "finance.view", scope: "all" },
  { permission: "finance.approve", scope: "all" },
  { permission: "compliance.view", scope: "all" },
  { permission: "compliance.approve", scope: "all" },
  { permission: "vendors.view", scope: "all" },
  { permission: "risk.view", scope: "all" },
  { permission: "documents.view", scope: "all" },
  { permission: "insights.view", scope: "all" },
  { permission: "insights.export", scope: "all" },
  { permission: "marketing.view", scope: "all" },
  { permission: "admin.view", scope: "all" },
  { permission: "admin.manage", scope: "all" },
];

function actor(
  id: string,
  personId: Id,
  displayName: string,
  roleLabel: string,
  organizationId: Id,
  grants: readonly PermissionGrant[],
  assignedProgramIds: readonly Id[] = [],
): Actor {
  return {
    id,
    personId,
    displayName,
    roleLabel,
    organizationId,
    isAuthenticated: true,
    grants,
    assignedProgramIds,
  };
}

export const DEMO_PERSONAS: readonly DemoPersona[] = [
  {
    id: "parent",
    label: "Parent",
    summary: "Signs in to a household with two children and applies on their behalf.",
    surface: "family",
    accountId: DEMO_ACCOUNTS.parentHousehold,
    actor: actor(
      "actor_demo_parent",
      DEMO_PEOPLE.parent,
      "Demo Guardian 1",
      "Parent",
      NATIONAL_ORG,
      FAMILY_GRANTS,
    ),
  },
  {
    id: "adult_participant",
    label: "Adult participant",
    summary: "Applies for themselves — one profile, no household.",
    surface: "family",
    accountId: DEMO_ACCOUNTS.adultParticipant,
    actor: actor(
      "actor_demo_adult_participant",
      DEMO_PEOPLE.adultParticipant,
      "Demo Participant 1",
      "Participant",
      NATIONAL_ORG,
      FAMILY_GRANTS,
    ),
  },
  {
    id: "staff_applicant",
    label: "Staff applicant",
    summary: "Applies for a volunteer role and waits on a background check.",
    surface: "family",
    accountId: DEMO_ACCOUNTS.staffApplicant,
    actor: actor(
      "actor_demo_staff_applicant",
      DEMO_PEOPLE.staffApplicant,
      "Demo Volunteer 1",
      "Staff applicant",
      NATIONAL_ORG,
      FAMILY_GRANTS,
    ),
  },
  {
    id: "reviewer",
    label: "Reviewer",
    summary: "Scores Mosaic applications blind. No finance, no other camp.",
    surface: "operations",
    accountId: null,
    actor: actor(
      "actor_demo_reviewer",
      DEMO_PEOPLE.reviewer,
      "Demo Staff 1",
      "Prioritization reviewer",
      NATIONAL_ORG,
      REVIEWER_GRANTS,
      ["prog_mosaic"],
    ),
  },
  {
    id: "camp_lead",
    label: "Camp lead (LPT)",
    summary: "Decides accept, waitlist and reject — for Mosaic only.",
    surface: "operations",
    accountId: null,
    actor: actor(
      "actor_demo_camp_lead",
      DEMO_PEOPLE.campLead,
      "Demo Program Manager",
      "Camp lead",
      NATIONAL_ORG,
      CAMP_LEAD_GRANTS,
      ["prog_mosaic"],
    ),
  },
  {
    id: "npt",
    label: "National team (NPT)",
    summary: "Every program, one region. Edits rubrics; sees Southwest only.",
    surface: "operations",
    accountId: null,
    actor: actor(
      "actor_demo_npt",
      DEMO_PEOPLE.npt,
      "Demo Regional Lead",
      "National Project Team",
      SOUTHWEST_REGION,
      NPT_GRANTS,
    ),
  },
  {
    id: "senior_admin",
    label: "Senior admin (JMC)",
    summary: "Organisation-wide. The default view.",
    surface: "operations",
    accountId: null,
    actor: actor(
      "actor_demo_senior_admin",
      DEMO_PEOPLE.seniorAdmin,
      "Demo Administrator",
      "Senior administrator",
      NATIONAL_ORG,
      SENIOR_ADMIN_GRANTS,
    ),
  },
];

export const DEFAULT_PERSONA_ID: PersonaId = "senior_admin";

const PERSONAS_BY_ID: ReadonlyMap<string, DemoPersona> = new Map(
  DEMO_PERSONAS.map((persona) => [persona.id, persona]),
);

export function isPersonaId(value: string): value is PersonaId {
  return PERSONAS_BY_ID.has(value);
}

/** Always returns a persona: an unknown id falls back rather than throwing. */
export function getPersona(id: string | null | undefined): DemoPersona {
  const persona = id ? PERSONAS_BY_ID.get(id) : undefined;
  return persona ?? PERSONAS_BY_ID.get(DEFAULT_PERSONA_ID)!;
}

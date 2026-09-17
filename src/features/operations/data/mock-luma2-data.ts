import type {
  Account,
  ApplicationForm,
  ApplicationQuestion,
  ApplicationSection,
  ApplicationStatus,
  ApplicationSubmission,
  ChecklistItemDefinition,
  ChecklistProgress,
  EligibilityCriteria,
  Id,
  Interview,
  Invitation,
  MatchReview,
  PersonRelationship,
  Profile,
  RelationshipAccessGrant,
  ScoringRubric,
  SelectionDecision,
} from "../domain";

/**
 * Seed data for the Luma 2.0 surfaces: households, applications and checklists.
 *
 * Separate from `mock-data.ts` on purpose. That file is guarded by a hygiene
 * test that forbids email addresses, phone numbers and a `dateOfBirth` key
 * outright — a good rule for a file describing programs and staff. This file
 * cannot obey it: eligibility is decided on a date of birth, and account
 * linking is demonstrated by two records sharing an email. Refusing those
 * fields here would mean refusing to demo the two features the team most needs
 * to see.
 *
 * So the rule is adapted rather than dropped, and `mock-luma2-data.test.ts`
 * enforces the adapted version:
 *
 *   - names are obvious placeholders ("Demo ...")
 *   - every email is at `@example.invalid`, a reserved TLD that cannot resolve
 *   - every phone is in the 555-01xx range reserved for fiction
 *   - dates of birth are synthetic and belong to no one
 *
 * Nothing here describes a real person, and nothing here should ever be
 * replaced with a row from a real export.
 */

const DOMAIN = "example.invalid";

const SEED_ACCOUNTS: readonly Account[] = [
  {
    id: "acct_demo_household_1",
    email: `demo.guardian1@${DOMAIN}`,
    emailVerified: true,
    status: "active",
    phone: "555-0101",
    city: "Sugar Land",
    state: "TX",
    postalCode: "77479",
    regionId: "org_southwest",
    jamatkhana: "Southwest — Headquarters",
    createdAt: "2026-02-14T16:20:00.000Z",
    lastSignInAt: "2026-09-14T02:05:00.000Z",
  },
  {
    id: "acct_demo_adult_1",
    email: `demo.participant1@${DOMAIN}`,
    emailVerified: true,
    status: "active",
    phone: "555-0102",
    city: "Boston",
    state: "MA",
    postalCode: "02118",
    regionId: "org_northeast",
    jamatkhana: "Northeast — Central",
    createdAt: "2026-05-02T13:00:00.000Z",
    lastSignInAt: "2026-09-15T18:40:00.000Z",
  },
  {
    id: "acct_demo_staff_applicant_1",
    email: `demo.volunteer1@${DOMAIN}`,
    emailVerified: true,
    status: "active",
    phone: "555-0103",
    city: "Chicago",
    state: "IL",
    postalCode: "60614",
    regionId: "org_midwest",
    jamatkhana: "Midwest — Lakeside",
    createdAt: "2026-06-11T09:30:00.000Z",
    lastSignInAt: "2026-09-16T01:15:00.000Z",
  },
  {
    // The second guardian: invited, has not signed in. Demonstrates that an
    // invitation creates no access until it is accepted.
    id: "acct_demo_household_1_second",
    email: `demo.guardian2@${DOMAIN}`,
    emailVerified: false,
    status: "email_unverified",
    phone: null,
    city: "Sugar Land",
    state: "TX",
    postalCode: "77479",
    regionId: "org_southwest",
    jamatkhana: "Southwest — Headquarters",
    createdAt: "2026-09-10T15:00:00.000Z",
    lastSignInAt: null,
  },
];

/**
 * Household members.
 *
 * Deliberately varied so eligibility has something to say: one child clears
 * Mosaic on age but misses Embark on grade, the other is the reverse. A demo
 * where every profile qualifies for everything proves nothing.
 */
const SEED_PROFILES: readonly Profile[] = [
  {
    id: "prof_demo_guardian_1",
    accountId: "acct_demo_household_1",
    personId: "person_9",
    personLinkStatus: "verified",
    kind: "self",
    legalFirstName: "Demo",
    legalLastName: "Guardian One",
    preferredName: null,
    dateOfBirth: "1986-04-22",
    risingSecularGrade: null,
    risingRecGrade: null,
    schoolName: null,
    schoolType: null,
    languages: [
      { language: "English", level: "native" },
      { language: "Gujarati", level: "fluent" },
    ],
    needsTranslator: false,
    ownAccountId: "acct_demo_household_1",
    createdAt: "2026-02-14T16:22:00.000Z",
  },
  {
    id: "prof_demo_child_1",
    accountId: "acct_demo_household_1",
    personId: "person_7",
    personLinkStatus: "verified",
    kind: "household_member",
    legalFirstName: "Demo",
    legalLastName: "Participant One",
    preferredName: "Demo P.",
    dateOfBirth: "2011-08-03",
    risingSecularGrade: 9,
    risingRecGrade: 8,
    schoolName: "Demo Regional High School",
    schoolType: "public",
    languages: [{ language: "English", level: "native" }],
    needsTranslator: false,
    ownAccountId: null,
    createdAt: "2026-02-14T16:30:00.000Z",
  },
  {
    id: "prof_demo_child_2",
    accountId: "acct_demo_household_1",
    personId: "person_8",
    personLinkStatus: "verified",
    kind: "household_member",
    legalFirstName: "Demo",
    legalLastName: "Participant Two",
    preferredName: null,
    dateOfBirth: "2014-01-17",
    risingSecularGrade: 7,
    risingRecGrade: 6,
    schoolName: "Demo Regional Middle School",
    schoolType: "public",
    languages: [
      { language: "English", level: "native" },
      { language: "Urdu", level: "conversational" },
    ],
    needsTranslator: false,
    ownAccountId: null,
    createdAt: "2026-02-14T16:34:00.000Z",
  },
  {
    // The teen who signed up separately and was linked back to the household
    // by matching email and phone. Left as pending_match so the review queue
    // has something real in it.
    id: "prof_demo_child_3",
    accountId: "acct_demo_household_1",
    personId: null,
    personLinkStatus: "pending_match",
    kind: "household_member",
    legalFirstName: "Demo",
    legalLastName: "Participant Three",
    preferredName: null,
    dateOfBirth: "2009-11-29",
    risingSecularGrade: 11,
    risingRecGrade: 10,
    schoolName: "Demo Regional High School",
    schoolType: "public",
    languages: [{ language: "English", level: "native" }],
    needsTranslator: false,
    ownAccountId: null,
    createdAt: "2026-09-12T20:10:00.000Z",
  },
  {
    id: "prof_demo_adult_1",
    accountId: "acct_demo_adult_1",
    personId: "person_7",
    personLinkStatus: "verified",
    kind: "self",
    legalFirstName: "Demo",
    legalLastName: "Adult Participant",
    preferredName: null,
    dateOfBirth: "2004-03-09",
    risingSecularGrade: null,
    risingRecGrade: null,
    schoolName: "Demo State University",
    schoolType: "public",
    languages: [{ language: "English", level: "native" }],
    needsTranslator: false,
    ownAccountId: "acct_demo_adult_1",
    createdAt: "2026-05-02T13:05:00.000Z",
  },
  {
    id: "prof_demo_staff_1",
    accountId: "acct_demo_staff_applicant_1",
    personId: "person_1",
    personLinkStatus: "verified",
    kind: "self",
    legalFirstName: "Demo",
    legalLastName: "Volunteer One",
    preferredName: null,
    dateOfBirth: "1999-07-14",
    risingSecularGrade: null,
    risingRecGrade: null,
    schoolName: null,
    schoolType: null,
    languages: [
      { language: "English", level: "native" },
      { language: "Farsi", level: "conversational" },
    ],
    needsTranslator: false,
    ownAccountId: "acct_demo_staff_applicant_1",
    createdAt: "2026-06-11T09:35:00.000Z",
  },
];

export const RELATIONSHIPS: readonly PersonRelationship[] = [
  {
    id: "rel_1",
    fromProfileId: "prof_demo_guardian_1",
    toProfileId: "prof_demo_child_1",
    kind: "parent",
    verification: "verified",
    createdAt: "2026-02-14T16:30:00.000Z",
  },
  {
    id: "rel_2",
    fromProfileId: "prof_demo_guardian_1",
    toProfileId: "prof_demo_child_2",
    kind: "parent",
    verification: "verified",
    createdAt: "2026-02-14T16:34:00.000Z",
  },
  {
    id: "rel_3",
    fromProfileId: "prof_demo_guardian_1",
    toProfileId: "prof_demo_child_3",
    kind: "parent",
    verification: "pending_verification",
    createdAt: "2026-09-12T20:10:00.000Z",
  },
];

/**
 * Access is granted per child and per program, never per role.
 *
 * Note what the third grant omits: the guardian of the pending child may
 * complete forms for the current registration, but holds no `view_health`.
 * That is the Person-Linking doc's rule made concrete — a relationship that is
 * not yet verified does not open the sensitive record.
 */
export const ACCESS_GRANTS: readonly RelationshipAccessGrant[] = [
  {
    id: "grant_1",
    relationshipId: "rel_1",
    subjectProfileId: "prof_demo_child_1",
    programId: null,
    actions: [
      "complete_forms",
      "sign_waivers",
      "manage_registration",
      "view_payment_status",
      "receive_communications",
      "view_health",
    ],
    grantedAt: "2026-02-14T16:31:00.000Z",
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: "grant_2",
    relationshipId: "rel_2",
    subjectProfileId: "prof_demo_child_2",
    programId: null,
    actions: [
      "complete_forms",
      "sign_waivers",
      "manage_registration",
      "view_payment_status",
      "receive_communications",
      "view_health",
    ],
    grantedAt: "2026-02-14T16:35:00.000Z",
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: "grant_3",
    relationshipId: "rel_3",
    subjectProfileId: "prof_demo_child_3",
    programId: "prog_al_ummah",
    actions: ["complete_forms", "manage_registration", "receive_communications"],
    grantedAt: "2026-09-12T20:12:00.000Z",
    expiresAt: null,
    revokedAt: null,
  },
];

export const MATCH_REVIEWS: readonly MatchReview[] = [
  {
    id: "match_1",
    accountId: "acct_demo_household_1",
    profileId: "prof_demo_child_3",
    candidatePersonId: "person_2",
    candidateLabel: "Demo Volunteer 2",
    outcome: "uncertain",
    evidence: ["name_and_dob"],
    confidence: 0.62,
    status: "open",
    raisedAt: "2026-09-12T20:11:00.000Z",
    resolvedAt: null,
    resolvedByPersonId: null,
    note: "Same name and date of birth as an existing record in another region.",
  },
  {
    id: "match_2",
    accountId: "acct_demo_staff_applicant_1",
    profileId: "prof_demo_staff_1",
    candidatePersonId: "person_1",
    candidateLabel: "Demo Volunteer 1",
    outcome: "confirmed",
    evidence: ["invitation_token", "verified_email"],
    confidence: 1,
    status: "linked",
    raisedAt: "2026-06-11T09:36:00.000Z",
    resolvedAt: "2026-06-11T09:36:00.000Z",
    resolvedByPersonId: null,
    note: "Linked automatically: invitation token is unambiguous evidence.",
  },
  {
    id: "match_3",
    accountId: "acct_demo_household_1_second",
    profileId: "prof_demo_guardian_1",
    candidatePersonId: "person_9",
    candidateLabel: "Demo Guardian 1",
    outcome: "conflict",
    evidence: ["email_and_phone", "name_only"],
    confidence: 0.41,
    status: "open",
    raisedAt: "2026-09-10T15:02:00.000Z",
    resolvedAt: null,
    resolvedByPersonId: null,
    note: "Shares a household phone with an existing guardian but the names differ.",
  },
];

export const INVITATIONS: readonly Invitation[] = [
  {
    id: "inv_1",
    email: `demo.guardian2@${DOMAIN}`,
    invitedPersonId: null,
    invitedProfileId: "prof_demo_guardian_1",
    purpose: "second_guardian",
    status: "pending",
    sentAt: "2026-09-10T15:00:00.000Z",
    expiresAt: "2026-10-10",
    acceptedAt: null,
  },
];

// ---------------------------------------------------------------------------
// Eligibility
//
// Each open instance states its own criteria, and the shapes differ on
// purpose: Embark admits by rising secular grade and first-timers only,
// Al-Ummah by age, Mosaic by either. That variety is the point — it is what
// the "universal" application has to absorb without a per-camp fork.
// ---------------------------------------------------------------------------

export const ELIGIBILITY_CRITERIA: readonly EligibilityCriteria[] = [
  {
    id: "elig_mosaic_fall_ne_participant",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    audience: "participant",
    rules: [
      { kind: "age", minAge: 13, maxAge: 17, asOf: "2026-10-05" },
      { kind: "secular_grade", minGrade: 8, maxGrade: 12 },
    ],
    regionIds: null,
    firstTimeOnly: false,
    note: "Either the age band or the grade band qualifies.",
  },
  {
    id: "elig_mosaic_fall_ne_staff",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    audience: "staff",
    rules: [{ kind: "age", minAge: 14, maxAge: 99, asOf: "2026-10-05" }],
    regionIds: null,
    firstTimeOnly: false,
    note: "Guides may serve from 14; leadership roles are gated separately.",
  },
  {
    id: "elig_mosaic_winter_mw_participant",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_winter_mw",
    audience: "participant",
    rules: [{ kind: "age", minAge: 13, maxAge: 17, asOf: "2027-01-10" }],
    regionIds: ["org_midwest"],
    firstTimeOnly: false,
    note: "Midwest delivery: open to Midwest families.",
  },
  {
    id: "elig_embark_fall_ne_participant",
    programId: "prog_embark",
    programInstanceId: "inst_embark_fall_ne",
    audience: "participant",
    rules: [{ kind: "secular_grade", minGrade: 7, maxGrade: 9 }],
    regionIds: null,
    firstTimeOnly: true,
    note: "Rising 7th–9th, first-time attendees only.",
  },
  {
    id: "elig_al_ummah_fall_participant",
    programId: "prog_al_ummah",
    programInstanceId: "inst_al_ummah_fall_national",
    audience: "participant",
    rules: [
      { kind: "age", minAge: 16, maxAge: 17, asOf: "2026-11-02" },
      { kind: "secular_grade", minGrade: 11, maxGrade: 12 },
    ],
    regionIds: null,
    firstTimeOnly: false,
    note: "High school juniors and seniors.",
  },
  {
    id: "elig_khidma_spring_ne_participant",
    programId: "prog_khidma",
    programInstanceId: "inst_khidma_spring_2027_ne",
    audience: "participant",
    rules: [{ kind: "age", minAge: 14, maxAge: 16, asOf: "2027-03-01" }],
    regionIds: null,
    firstTimeOnly: false,
    note: null,
  },
  {
    id: "elig_cpoi_training_ne_staff",
    programId: "prog_cpoi",
    programInstanceId: "inst_cpoi_training_ne",
    audience: "staff",
    rules: [{ kind: "age", minAge: 18, maxAge: 99, asOf: "2026-11-15" }],
    regionIds: null,
    firstTimeOnly: false,
    note: "Adults only; a cleared background check is required to onboard.",
  },
  {
    id: "elig_olympia_games_ne_participant",
    programId: "prog_olympia",
    programInstanceId: "inst_olympia_games_ne",
    audience: "participant",
    rules: [{ kind: "age", minAge: 11, maxAge: 14, asOf: "2026-11-07" }],
    regionIds: ["org_northeast"],
    firstTimeOnly: false,
    note: null,
  },
];

// ---------------------------------------------------------------------------
// The universal application
//
// Two shared sections and one owned by the camp — the shape the 09-09 call
// asked for after reviewing a five-section draft. Section one is almost
// entirely prefilled: the applicant confirms what their profile already knows
// rather than typing it again, which is where most of the length went.
// ---------------------------------------------------------------------------

const PARTICIPANT_SECTIONS: readonly ApplicationSection[] = [
  {
    id: "sec_p_confirm",
    formId: "form_participant_2026",
    kind: "profile_confirmation",
    title: "About the participant",
    description: "We've filled this in from the profile. Check it's still right.",
    order: 1,
    ownedByProgramId: null,
  },
  {
    id: "sec_p_background",
    formId: "form_participant_2026",
    kind: "background",
    title: "Background",
    description: "Education, languages and any camps attended before.",
    order: 2,
    ownedByProgramId: null,
  },
  {
    id: "sec_p_camp",
    formId: "form_participant_2026",
    kind: "camp_specific",
    title: "Camp questions",
    description: "Set by the camp team, and they change year to year.",
    order: 3,
    ownedByProgramId: "prog_mosaic",
  },
];

/** A dozen of the ~85 US Jamatkhanas — enough to prove the typeahead. */
const JAMATKHANA_OPTIONS = [
  { value: "sw_hq", label: "Southwest — Headquarters", group: "Southwest" },
  { value: "sw_principal", label: "Southwest — Principal", group: "Southwest" },
  { value: "sw_sugarland", label: "Southwest — Sugar Land", group: "Southwest" },
  { value: "sw_plano", label: "Southwest — Plano", group: "Southwest" },
  { value: "ne_central", label: "Northeast — Central", group: "Northeast" },
  { value: "ne_darkhana", label: "Northeast — Darkhana", group: "Northeast" },
  { value: "ne_boston", label: "Northeast — Boston", group: "Northeast" },
  { value: "mw_lakeside", label: "Midwest — Lakeside", group: "Midwest" },
  { value: "mw_northshore", label: "Midwest — North Shore", group: "Midwest" },
  { value: "mw_glenview", label: "Midwest — Glenview", group: "Midwest" },
];

const LANGUAGE_OPTIONS = [
  "English",
  "Gujarati",
  "Urdu",
  "Farsi",
  "Arabic",
  "French",
  "Portuguese",
  "Russian",
  "Tajik",
].map((language) => ({ value: language.toLowerCase(), label: language }));

const SCHOOL_TYPE_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "charter", label: "Charter" },
  { value: "parochial", label: "Parochial" },
  { value: "home", label: "Home school" },
  { value: "other", label: "Other" },
];

const PARTICIPANT_QUESTIONS: readonly ApplicationQuestion[] = [
  {
    id: "q_first_name",
    sectionId: "sec_p_confirm",
    type: "short_text",
    label: "Legal first name",
    helpText: null,
    required: true,
    order: 1,
    prefillFrom: "profile.legalFirstName",
  },
  {
    id: "q_last_name",
    sectionId: "sec_p_confirm",
    type: "short_text",
    label: "Legal last name",
    helpText: null,
    required: true,
    order: 2,
    prefillFrom: "profile.legalLastName",
  },
  {
    id: "q_preferred_name",
    sectionId: "sec_p_confirm",
    type: "short_text",
    label: "Preferred name",
    helpText: "What we'll call them at camp, if it's different.",
    required: false,
    order: 3,
    prefillFrom: "profile.preferredName",
  },
  {
    id: "q_dob",
    sectionId: "sec_p_confirm",
    type: "date",
    label: "Date of birth",
    helpText: "Used to work out which camps they're eligible for.",
    required: true,
    order: 4,
    prefillFrom: "profile.dateOfBirth",
  },
  {
    id: "q_city",
    sectionId: "sec_p_confirm",
    type: "short_text",
    label: "City",
    helpText: null,
    required: true,
    order: 5,
    prefillFrom: "account.city",
  },
  {
    id: "q_state",
    sectionId: "sec_p_confirm",
    type: "short_text",
    label: "State",
    helpText: null,
    required: true,
    order: 6,
    prefillFrom: "account.state",
  },
  {
    id: "q_postal",
    sectionId: "sec_p_confirm",
    type: "short_text",
    label: "ZIP code",
    // The call dropped street address and kept ZIP: the analysis it feeds
    // works at ZIP level, and nothing was posted to a street address.
    helpText: "We don't need a street address here — the health form collects one later.",
    required: true,
    order: 7,
    prefillFrom: "account.postalCode",
  },
  {
    id: "q_jamatkhana",
    sectionId: "sec_p_confirm",
    type: "typeahead",
    label: "Home Jamatkhana",
    helpText: "Start typing to find it.",
    required: true,
    order: 8,
    options: JAMATKHANA_OPTIONS,
    prefillFrom: "account.jamatkhana",
  },
  {
    id: "q_tshirt",
    sectionId: "sec_p_confirm",
    type: "select",
    label: "T-shirt size",
    helpText: null,
    required: true,
    order: 9,
    options: ["YS", "YM", "YL", "S", "M", "L", "XL", "2XL"].map((size) => ({
      value: size.toLowerCase(),
      label: size,
    })),
  },
  {
    id: "q_secular_grade",
    sectionId: "sec_p_background",
    type: "number",
    label: "Rising school grade",
    helpText: "The grade they'll start in the autumn.",
    required: true,
    order: 1,
    prefillFrom: "profile.risingSecularGrade",
  },
  {
    id: "q_rec_grade",
    sectionId: "sec_p_background",
    type: "number",
    label: "Rising REC grade",
    helpText: null,
    required: true,
    order: 2,
    prefillFrom: "profile.risingRecGrade",
  },
  {
    id: "q_school_name",
    sectionId: "sec_p_background",
    type: "short_text",
    label: "School name",
    helpText: null,
    required: true,
    order: 3,
    prefillFrom: "profile.schoolName",
  },
  {
    id: "q_school_type",
    sectionId: "sec_p_background",
    type: "select",
    label: "School type",
    helpText: null,
    required: true,
    order: 4,
    options: SCHOOL_TYPE_OPTIONS,
    prefillFrom: "profile.schoolType",
  },
  {
    id: "q_languages",
    sectionId: "sec_p_background",
    type: "multi_select",
    label: "Languages spoken",
    helpText: null,
    required: false,
    order: 5,
    options: LANGUAGE_OPTIONS,
    prefillFrom: "profile.languages",
  },
  {
    id: "q_translator",
    sectionId: "sec_p_background",
    type: "boolean",
    label: "Does anyone in the family need a translator?",
    helpText: null,
    required: false,
    order: 6,
    prefillFrom: "profile.needsTranslator",
  },
  {
    id: "q_heard_about",
    sectionId: "sec_p_background",
    type: "select",
    label: "How did you hear about camp?",
    helpText: null,
    required: false,
    order: 7,
    options: [
      { value: "jk", label: "At Jamatkhana" },
      { value: "friend", label: "From a friend or family member" },
      { value: "school", label: "At REC" },
      { value: "social", label: "Social media" },
      { value: "other", label: "Somewhere else" },
    ],
  },
  {
    id: "q_attended_before",
    sectionId: "sec_p_background",
    type: "boolean",
    label: "Have they attended a JMC camp before?",
    helpText: null,
    required: true,
    order: 8,
  },
  {
    id: "q_prior_camps",
    sectionId: "sec_p_background",
    type: "repeatable_group",
    label: "Which camps?",
    helpText: "Add one row per camp.",
    required: false,
    order: 9,
    // Capped, per the call: an unbounded list is a support problem.
    maxEntries: 12,
    visibleWhen: { questionId: "q_attended_before", equalsAnyOf: ["true"] },
    subQuestions: [
      {
        id: "q_prior_camp_name",
        sectionId: "sec_p_background",
        type: "select",
        label: "Camp",
        helpText: null,
        required: true,
        order: 1,
        options: [
          "Mosaic",
          "Embark",
          "Al-Ummah",
          "Khidma",
          "Olympia",
          "Roots",
          "Al-Ilm",
          "CPOI",
        ].map((name) => ({ value: name.toLowerCase(), label: name })),
      },
      {
        id: "q_prior_camp_year",
        sectionId: "sec_p_background",
        type: "number",
        label: "Year",
        helpText: null,
        required: true,
        order: 2,
      },
    ],
  },
  {
    id: "q_essay_why",
    sectionId: "sec_p_camp",
    type: "long_text",
    label: "Why do you want to come to camp this year?",
    helpText: "A few sentences is plenty.",
    required: true,
    order: 1,
    maxLength: 1200,
  },
  {
    id: "q_essay_contribute",
    sectionId: "sec_p_camp",
    type: "long_text",
    label: "Tell us about a time you helped someone in your community.",
    helpText: null,
    required: true,
    order: 2,
    maxLength: 1200,
  },
  {
    id: "q_essay_optional",
    sectionId: "sec_p_camp",
    type: "long_text",
    label: "Anything else we should know?",
    helpText: "Optional.",
    required: false,
    order: 3,
    maxLength: 800,
  },
];

const STAFF_SECTIONS: readonly ApplicationSection[] = [
  {
    id: "sec_s_confirm",
    formId: "form_staff_2026",
    kind: "profile_confirmation",
    title: "About you",
    description: "Confirm the details we already hold.",
    order: 1,
    ownedByProgramId: null,
  },
  {
    id: "sec_s_background",
    formId: "form_staff_2026",
    kind: "background",
    title: "Experience",
    description: "The roles you're interested in and what you bring to them.",
    order: 2,
    ownedByProgramId: null,
  },
  {
    id: "sec_s_camp",
    formId: "form_staff_2026",
    kind: "camp_specific",
    title: "Camp questions",
    description: null,
    order: 3,
    ownedByProgramId: "prog_cpoi",
  },
];

const STAFF_QUESTIONS: readonly ApplicationQuestion[] = [
  {
    id: "q_s_first_name",
    sectionId: "sec_s_confirm",
    type: "short_text",
    label: "Legal first name",
    helpText: null,
    required: true,
    order: 1,
    prefillFrom: "profile.legalFirstName",
  },
  {
    id: "q_s_last_name",
    sectionId: "sec_s_confirm",
    type: "short_text",
    label: "Legal last name",
    helpText: null,
    required: true,
    order: 2,
    prefillFrom: "profile.legalLastName",
  },
  {
    id: "q_s_dob",
    sectionId: "sec_s_confirm",
    type: "date",
    label: "Date of birth",
    helpText: null,
    required: true,
    order: 3,
    prefillFrom: "profile.dateOfBirth",
  },
  {
    id: "q_s_phone",
    sectionId: "sec_s_confirm",
    type: "phone",
    label: "Mobile number",
    helpText: null,
    required: true,
    order: 4,
    prefillFrom: "account.phone",
  },
  {
    id: "q_s_jamatkhana",
    sectionId: "sec_s_confirm",
    type: "typeahead",
    label: "Home Jamatkhana",
    helpText: null,
    required: true,
    order: 5,
    options: JAMATKHANA_OPTIONS,
    prefillFrom: "account.jamatkhana",
  },
  {
    id: "q_s_roles",
    sectionId: "sec_s_background",
    type: "multi_select",
    label: "Which roles are you applying for?",
    helpText: "Pick as many as you'd consider.",
    required: true,
    order: 1,
    options: [
      { value: "guide", label: "Guide" },
      { value: "counselor", label: "Counselor" },
      { value: "activity_lead", label: "Activity lead" },
      { value: "health", label: "Health team" },
      { value: "driver", label: "Driver" },
      { value: "kitchen", label: "Kitchen" },
    ],
  },
  {
    id: "q_s_resume",
    sectionId: "sec_s_background",
    type: "file_upload",
    label: "Resume",
    helpText: "PDF or Word. We'll show it to reviewers in the browser.",
    required: true,
    order: 2,
    acceptedFileTypes: [".pdf", ".doc", ".docx"],
  },
  {
    id: "q_s_prior_service",
    sectionId: "sec_s_background",
    type: "repeatable_group",
    label: "Previous JMC service",
    helpText: null,
    required: false,
    order: 3,
    maxEntries: 12,
    subQuestions: [
      {
        id: "q_s_prior_camp",
        sectionId: "sec_s_background",
        type: "short_text",
        label: "Camp",
        helpText: null,
        required: true,
        order: 1,
      },
      {
        id: "q_s_prior_role",
        sectionId: "sec_s_background",
        type: "short_text",
        label: "Role",
        helpText: null,
        required: true,
        order: 2,
      },
      {
        id: "q_s_prior_year",
        sectionId: "sec_s_background",
        type: "number",
        label: "Year",
        helpText: null,
        required: true,
        order: 3,
      },
    ],
  },
  {
    id: "q_s_essay_motivation",
    sectionId: "sec_s_camp",
    type: "long_text",
    label: "Why do you want to serve at this camp?",
    helpText: null,
    required: true,
    order: 1,
    maxLength: 1500,
  },
  {
    id: "q_s_availability",
    sectionId: "sec_s_camp",
    type: "boolean",
    label: "Can you attend the full staff training?",
    helpText: null,
    required: true,
    order: 2,
  },
];

export const APPLICATION_FORMS: readonly ApplicationForm[] = [
  {
    id: "form_participant_2026",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    audience: "participant",
    title: "Mosaic Fall 2026 — participant application",
    status: "published",
    opensOn: "2026-08-15",
    deadline: "2026-09-30",
    version: 2,
    sections: PARTICIPANT_SECTIONS,
    questions: PARTICIPANT_QUESTIONS,
  },
  {
    id: "form_staff_2026",
    programId: "prog_cpoi",
    programInstanceId: "inst_cpoi_training_ne",
    audience: "staff",
    title: "CPOI 2026 — staff application",
    status: "published",
    opensOn: "2026-08-01",
    deadline: "2026-10-15",
    version: 1,
    sections: STAFF_SECTIONS,
    questions: STAFF_QUESTIONS,
  },
];

// ---------------------------------------------------------------------------
// Rubrics
//
// One per instance and versioned, because a decision has to stay readable
// after the rubric moves on: "accepted under v2" must mean something a year
// later. The BRD flags a single generic scorer as a high risk for exactly this
// reason — Al-Ummah's demographic points and Mosaic's PSW weighting are
// different instruments, not one instrument with different numbers.
// ---------------------------------------------------------------------------

export const RUBRICS: readonly ScoringRubric[] = [
  {
    id: "rubric_mosaic_2026",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    name: "Mosaic Fall 2026 prioritization",
    version: 2,
    status: "active",
    criteria: [
      {
        id: "crit_first_time",
        rubricId: "rubric_mosaic_2026",
        kind: "demographic",
        label: "First-time attendee",
        description: "Priority for participants who have not attended before.",
        maxPoints: 20,
        weight: 1,
        sourceQuestionId: "q_attended_before",
      },
      {
        id: "crit_region_reach",
        rubricId: "rubric_mosaic_2026",
        kind: "demographic",
        label: "Under-represented Jamatkhana",
        description: "Points for reaching Jamatkhanas with low recent attendance.",
        maxPoints: 15,
        weight: 1,
        sourceQuestionId: "q_jamatkhana",
      },
      {
        id: "crit_essay_motivation",
        rubricId: "rubric_mosaic_2026",
        kind: "essay",
        label: "Motivation essay",
        description: "Clarity of reasons for attending, in the applicant's own voice.",
        maxPoints: 30,
        weight: 1.5,
        sourceQuestionId: "q_essay_why",
      },
      {
        id: "crit_essay_service",
        rubricId: "rubric_mosaic_2026",
        kind: "essay",
        label: "Service example",
        description: "Evidence of contribution to their community.",
        maxPoints: 25,
        weight: 1.25,
        sourceQuestionId: "q_essay_contribute",
      },
      {
        id: "crit_interview",
        rubricId: "rubric_mosaic_2026",
        kind: "interview",
        label: "Interview impression",
        description: "Recorded only where an interview took place.",
        maxPoints: 10,
        weight: 1,
        sourceQuestionId: null,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Submissions
//
// The family's own applications are written out by hand so the demo path is
// stable and every state a presenter needs to show is guaranteed present: a
// half-finished draft, one under review, one accepted and awaiting
// confirmation, one waitlisted, and a staff application stuck behind a
// background check.
//
// The rest of the Mosaic cohort is generated, because a selection screen with
// six rows does not show what a selection screen is for. The generator is
// deterministic — a fixed seed, no Math.random, no Date.now — so a server
// render and a client render produce byte-identical rows. A demo that
// reshuffles on hydration looks broken.
// ---------------------------------------------------------------------------

/** Mulberry32: small, fast, and stable across engines. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

const NOW = "2026-09-16T12:00:00.000Z";

export const HAND_WRITTEN_SUBMISSIONS: readonly ApplicationSubmission[] = [
  {
    // Half-finished: section one done, background started. The save-and-resume
    // case, which is the one families actually hit.
    id: "sub_demo_draft",
    formId: "form_participant_2026",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    audience: "participant",
    accountId: "acct_demo_household_1",
    profileId: "prof_demo_child_2",
    personId: "person_8",
    status: "draft",
    formVersion: 2,
    answers: [
      { questionId: "q_first_name", value: "Demo" },
      { questionId: "q_last_name", value: "Participant Two" },
      { questionId: "q_dob", value: "2014-01-17" },
      { questionId: "q_city", value: "Sugar Land" },
      { questionId: "q_state", value: "TX" },
      { questionId: "q_postal", value: "77479" },
      { questionId: "q_jamatkhana", value: "sw_sugarland" },
      { questionId: "q_tshirt", value: "ym" },
      { questionId: "q_secular_grade", value: 7 },
    ],
    completedSectionIds: ["sec_p_confirm"],
    startedAt: "2026-09-13T19:02:00.000Z",
    lastSavedAt: "2026-09-13T19:24:00.000Z",
    submittedAt: null,
    confirmByDate: null,
    backgroundCheckRequired: false,
    backgroundCheckStatus: null,
  },
  {
    id: "sub_demo_accepted",
    formId: "form_participant_2026",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    audience: "participant",
    accountId: "acct_demo_household_1",
    profileId: "prof_demo_child_1",
    personId: "person_7",
    status: "accepted",
    formVersion: 2,
    answers: [
      { questionId: "q_first_name", value: "Demo" },
      { questionId: "q_last_name", value: "Participant One" },
      { questionId: "q_dob", value: "2011-08-03" },
      { questionId: "q_attended_before", value: false },
      { questionId: "q_essay_why", value: "Placeholder essay response for the demo." },
      { questionId: "q_essay_contribute", value: "Placeholder essay response for the demo." },
    ],
    completedSectionIds: ["sec_p_confirm", "sec_p_background", "sec_p_camp"],
    startedAt: "2026-08-20T15:00:00.000Z",
    lastSavedAt: "2026-08-22T18:30:00.000Z",
    submittedAt: "2026-08-22T18:30:00.000Z",
    // Deliberately close: the countdown, the reminder and the auto-waitlist on
    // a missed deadline are all things the demo needs to show.
    confirmByDate: "2026-09-23",
    backgroundCheckRequired: false,
    backgroundCheckStatus: null,
  },
  {
    id: "sub_demo_waitlisted",
    formId: "form_participant_2026",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    audience: "participant",
    accountId: "acct_demo_household_1",
    profileId: "prof_demo_child_3",
    personId: null,
    status: "waitlisted",
    formVersion: 2,
    answers: [],
    completedSectionIds: ["sec_p_confirm", "sec_p_background", "sec_p_camp"],
    startedAt: "2026-08-25T11:00:00.000Z",
    lastSavedAt: "2026-08-26T09:00:00.000Z",
    submittedAt: "2026-08-26T09:00:00.000Z",
    confirmByDate: null,
    backgroundCheckRequired: false,
    backgroundCheckStatus: null,
  },
  {
    id: "sub_demo_adult",
    formId: "form_participant_2026",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    audience: "participant",
    accountId: "acct_demo_adult_1",
    profileId: "prof_demo_adult_1",
    personId: "person_7",
    status: "under_review",
    formVersion: 2,
    answers: [],
    completedSectionIds: ["sec_p_confirm", "sec_p_background", "sec_p_camp"],
    startedAt: "2026-09-01T12:00:00.000Z",
    lastSavedAt: "2026-09-02T12:00:00.000Z",
    submittedAt: "2026-09-02T12:00:00.000Z",
    confirmByDate: null,
    backgroundCheckRequired: false,
    backgroundCheckStatus: null,
  },
  {
    // The gate that matters: accepted, but cannot be onboarded until the check
    // clears. The status machine refuses the transition; the UI explains why.
    id: "sub_demo_staff",
    formId: "form_staff_2026",
    programId: "prog_cpoi",
    programInstanceId: "inst_cpoi_training_ne",
    audience: "staff",
    accountId: "acct_demo_staff_applicant_1",
    profileId: "prof_demo_staff_1",
    personId: "person_1",
    status: "accepted",
    formVersion: 1,
    answers: [
      { questionId: "q_s_roles", value: ["counselor", "activity_lead"] },
      { questionId: "q_s_resume", value: "demo-resume.pdf", fileName: "demo-resume.pdf" },
      { questionId: "q_s_availability", value: true },
    ],
    completedSectionIds: ["sec_s_confirm", "sec_s_background", "sec_s_camp"],
    startedAt: "2026-08-05T10:00:00.000Z",
    lastSavedAt: "2026-08-07T14:00:00.000Z",
    submittedAt: "2026-08-07T14:00:00.000Z",
    confirmByDate: "2026-09-28",
    backgroundCheckRequired: true,
    backgroundCheckStatus: "in_progress",
  },
];

const COHORT_STATUSES: readonly ApplicationStatus[] = [
  "submitted",
  "under_review",
  "interview_scheduled",
  "interviewed",
  "scored",
  "recommended",
  "accepted",
  "waitlisted",
  "rejected",
];

const COHORT_JAMATKHANAS = JAMATKHANA_OPTIONS.map((option) => option.value);

/** The rest of the Mosaic Fall 2026 cohort. */
function buildCohort(): readonly ApplicationSubmission[] {
  const random = seededRandom(20260916);
  const submissions: ApplicationSubmission[] = [];

  for (let index = 1; index <= 48; index += 1) {
    const status = pick(random, COHORT_STATUSES);
    const attendedBefore = random() > 0.55;
    // Ages inside the Mosaic band, so every generated row is genuinely eligible.
    const birthYear = 2009 + Math.floor(random() * 5);
    const birthMonth = 1 + Math.floor(random() * 12);
    const birthDay = 1 + Math.floor(random() * 28);

    submissions.push({
      id: `sub_cohort_${index}`,
      formId: "form_participant_2026",
      programId: "prog_mosaic",
      programInstanceId: "inst_mosaic_fall_ne",
      audience: "participant",
      accountId: `acct_cohort_${index}`,
      profileId: `prof_cohort_${index}`,
      personId: null,
      status,
      formVersion: 2,
      answers: [
        { questionId: "q_first_name", value: "Demo" },
        { questionId: "q_last_name", value: `Applicant ${index}` },
        {
          questionId: "q_dob",
          value: `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`,
        },
        { questionId: "q_jamatkhana", value: pick(random, COHORT_JAMATKHANAS) },
        { questionId: "q_attended_before", value: attendedBefore },
        {
          questionId: "q_essay_why",
          value: "Placeholder essay response generated for the demo cohort.",
        },
        {
          questionId: "q_essay_contribute",
          value: "Placeholder essay response generated for the demo cohort.",
        },
      ],
      completedSectionIds: ["sec_p_confirm", "sec_p_background", "sec_p_camp"],
      startedAt: "2026-08-18T12:00:00.000Z",
      lastSavedAt: "2026-08-28T12:00:00.000Z",
      submittedAt: "2026-08-28T12:00:00.000Z",
      confirmByDate: status === "accepted" ? "2026-09-23" : null,
      backgroundCheckRequired: false,
      backgroundCheckStatus: null,
    });
  }

  return submissions;
}

const COHORT_SUBMISSIONS = buildCohort();

export const SUBMISSIONS: readonly ApplicationSubmission[] = [
  ...HAND_WRITTEN_SUBMISSIONS,
  ...COHORT_SUBMISSIONS,
];

/**
 * An account and a profile for every generated applicant.
 *
 * Without these the cohort's submissions pointed at people who did not exist,
 * and `getSubmissionDetail` — which needs a form, a profile *and* an account —
 * returned null for all 48 of them. The queue listed them happily, because it
 * falls back to a label, so every row past the five hand-written ones opened
 * onto "Application not found".
 *
 * Derived from each submission's own answers rather than generated separately,
 * so the age shown on the detail page is the age the row was filtered by.
 */
function cohortPerson(submission: ApplicationSubmission, index: number) {
  const answer = (questionId: string) =>
    submission.answers.find((entry) => entry.questionId === questionId)?.value ?? null;

  const account: Account = {
    id: `acct_cohort_${index}`,
    email: `demo.applicant${index}@${DOMAIN}`,
    emailVerified: true,
    status: "active",
    // 555-0100 upward stays inside the range reserved for fiction.
    phone: `555-01${String((index % 90) + 10).padStart(2, "0")}`,
    city: null,
    state: null,
    postalCode: null,
    regionId: "org_northeast",
    jamatkhana: typeof answer("q_jamatkhana") === "string" ? String(answer("q_jamatkhana")) : null,
    createdAt: "2026-08-18T12:00:00.000Z",
    lastSignInAt: "2026-08-28T12:00:00.000Z",
  };

  const dateOfBirth = typeof answer("q_dob") === "string" ? String(answer("q_dob")) : null;

  const profile: Profile = {
    id: `prof_cohort_${index}`,
    accountId: account.id,
    personId: null,
    personLinkStatus: "provisional",
    kind: "self",
    legalFirstName: "Demo",
    legalLastName: `Applicant ${index}`,
    preferredName: null,
    dateOfBirth,
    risingSecularGrade: null,
    risingRecGrade: null,
    schoolName: null,
    schoolType: null,
    languages: [],
    needsTranslator: false,
    ownAccountId: account.id,
    createdAt: "2026-08-18T12:00:00.000Z",
  };

  return { account, profile };
}

const COHORT_PEOPLE = COHORT_SUBMISSIONS.map((submission, position) =>
  cohortPerson(submission, position + 1),
);

export const COHORT_ACCOUNTS: readonly Account[] = COHORT_PEOPLE.map((entry) => entry.account);
export const COHORT_PROFILES: readonly Profile[] = COHORT_PEOPLE.map((entry) => entry.profile);

/** Names for generated applicants, kept out of the submission rows themselves. */
export const COHORT_APPLICANT_LABELS: ReadonlyMap<Id, string> = new Map(
  SUBMISSIONS.filter((submission) => submission.id.startsWith("sub_cohort_")).map((submission) => [
    submission.id,
    `Demo Applicant ${submission.id.replace("sub_cohort_", "")}`,
  ]),
);

function buildScores() {
  const random = seededRandom(773311);
  const rubric = RUBRICS[0]!;
  const scorable = SUBMISSIONS.filter((submission) =>
    ["scored", "recommended", "accepted", "waitlisted", "rejected", "interviewed"].includes(
      submission.status,
    ),
  );

  return scorable.map((submission) => {
    const criterionScores = rubric.criteria.map((criterion) => ({
      criterionId: criterion.id,
      points: Math.round(random() * criterion.maxPoints),
      note: null,
      // Essay criteria arrive pre-scored by the AI pass and stay flagged until
      // a human confirms them. The flag is the point: nothing is decided by a
      // machine without someone signing for it.
      aiSuggested: criterion.kind === "essay",
    }));

    return {
      id: `score_${submission.id}`,
      submissionId: submission.id,
      rubricId: rubric.id,
      rubricVersion: rubric.version,
      reviewerPersonId: "person_5",
      blind: true,
      criterionScores,
      totalPoints: criterionScores.reduce((total, score) => {
        const criterion = rubric.criteria.find((item) => item.id === score.criterionId)!;
        return total + score.points * criterion.weight;
      }, 0),
      submittedAt: "2026-09-05T16:00:00.000Z",
    };
  });
}

export const SCORES = buildScores();

export const INTERVIEWS: readonly Interview[] = SUBMISSIONS.filter((submission) =>
  ["interview_scheduled", "interviewed"].includes(submission.status),
).map((submission, index) => ({
  id: `intv_${submission.id}`,
  submissionId: submission.id,
  interviewerPersonId: "person_5",
  status: submission.status === "interviewed" ? "completed" : "scheduled",
  scheduledFor: `2026-09-${String(18 + (index % 8)).padStart(2, "0")}T15:00:00.000Z`,
  meetingUrl: null,
  notes:
    submission.status === "interviewed"
      ? "Placeholder interview note. Purged at the end of the cycle."
      : null,
  // Not left to whoever remembers: IUSA requires notes to go at cycle end, so
  // the record carries its own expiry.
  notesPurgeAfter: "2026-12-31",
}));

export const DECISIONS: readonly SelectionDecision[] = SUBMISSIONS.filter((submission) =>
  ["accepted", "waitlisted", "rejected"].includes(submission.status),
).map((submission) => ({
  id: `dec_${submission.id}`,
  submissionId: submission.id,
  outcome:
    submission.status === "accepted"
      ? "accept"
      : submission.status === "waitlisted"
        ? "waitlist"
        : "reject",
  decidedByPersonId: "person_3",
  decidedAt: "2026-09-08T17:00:00.000Z",
  rubricVersion: 2,
  emailTemplateId: null,
  releasedAt: "2026-09-09T09:00:00.000Z",
  note: null,
}));

// ---------------------------------------------------------------------------
// Post-acceptance checklists
// ---------------------------------------------------------------------------

export const CHECKLIST_DEFINITIONS: readonly ChecklistItemDefinition[] = [
  {
    id: "chk_health",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    kind: "health_form",
    title: "Health forms",
    description: "Medical history, physician sign-off and immunisation records.",
    icon: "heart-pulse",
    order: 1,
    dueDate: "2026-09-25",
    target: { kind: "health" },
    appliesToRoles: [],
    required: true,
  },
  {
    id: "chk_waivers",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    kind: "waiver",
    title: "Waivers",
    description: "Participation, media and transport consent.",
    icon: "file-signature",
    order: 2,
    dueDate: "2026-09-25",
    target: { kind: "waivers" },
    appliesToRoles: [],
    required: true,
  },
  {
    id: "chk_travel",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    kind: "travel",
    title: "Travel details",
    description: "How they're getting there and back.",
    icon: "plane",
    order: 3,
    dueDate: "2026-09-30",
    target: { kind: "travel" },
    appliesToRoles: [],
    required: true,
  },
  {
    id: "chk_payment",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    kind: "payment",
    title: "Camp fee",
    description: "Pay in full or set up a payment plan.",
    icon: "credit-card",
    order: 4,
    dueDate: "2026-10-01",
    target: { kind: "payment" },
    appliesToRoles: [],
    required: true,
  },
  {
    id: "chk_packing",
    programId: "prog_mosaic",
    programInstanceId: "inst_mosaic_fall_ne",
    kind: "custom",
    title: "Read the packing list",
    description: "Added by the camp team — an example of a custom item.",
    icon: "backpack",
    order: 5,
    dueDate: null,
    target: { kind: "external", url: "/camps/mosaic" },
    appliesToRoles: [],
    required: false,
  },
  {
    id: "chk_ypt",
    programId: "prog_cpoi",
    programInstanceId: "inst_cpoi_training_ne",
    kind: "training",
    title: "Youth protection training",
    description: "Required before serving at any camp.",
    icon: "shield-check",
    order: 1,
    dueDate: "2026-10-20",
    target: { kind: "external", url: "/operations/compliance" },
    appliesToRoles: [],
    required: true,
  },
  {
    id: "chk_background",
    programId: "prog_cpoi",
    programInstanceId: "inst_cpoi_training_ne",
    kind: "background_check",
    title: "Background check",
    description: "We'll email a link from Sterling. Status only — we never see the report.",
    icon: "badge-check",
    order: 2,
    dueDate: "2026-10-10",
    target: { kind: "none" },
    appliesToRoles: [],
    required: true,
  },
  {
    id: "chk_staff_waiver",
    programId: "prog_cpoi",
    programInstanceId: "inst_cpoi_training_ne",
    kind: "waiver",
    title: "Staff agreement",
    description: "Code of conduct and staff terms.",
    icon: "file-signature",
    order: 3,
    dueDate: "2026-10-20",
    target: { kind: "waivers" },
    appliesToRoles: [],
    required: true,
  },
];

export const CHECKLIST_PROGRESS: readonly ChecklistProgress[] = [
  {
    id: "prog_chk_1",
    definitionId: "chk_health",
    profileId: "prof_demo_child_1",
    programInstanceId: "inst_mosaic_fall_ne",
    status: "under_review",
    subStatus: "Physician form received — awaiting clinical review",
    updatedAt: "2026-09-12T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "prog_chk_2",
    definitionId: "chk_waivers",
    profileId: "prof_demo_child_1",
    programInstanceId: "inst_mosaic_fall_ne",
    status: "complete",
    subStatus: null,
    updatedAt: "2026-09-10T14:00:00.000Z",
    completedAt: "2026-09-10T14:00:00.000Z",
  },
  {
    id: "prog_chk_3",
    definitionId: "chk_travel",
    profileId: "prof_demo_child_1",
    programInstanceId: "inst_mosaic_fall_ne",
    status: "not_started",
    subStatus: null,
    updatedAt: "2026-09-09T09:00:00.000Z",
    completedAt: null,
  },
  {
    id: "prog_chk_4",
    definitionId: "chk_payment",
    profileId: "prof_demo_child_1",
    programInstanceId: "inst_mosaic_fall_ne",
    status: "in_progress",
    subStatus: "Payment plan — 1 of 3 instalments paid",
    updatedAt: "2026-09-11T16:00:00.000Z",
    completedAt: null,
  },
  {
    id: "prog_chk_5",
    definitionId: "chk_background",
    profileId: "prof_demo_staff_1",
    programInstanceId: "inst_cpoi_training_ne",
    status: "under_review",
    subStatus: "Sterling check in progress",
    updatedAt: "2026-09-14T08:00:00.000Z",
    completedAt: null,
  },
  {
    id: "prog_chk_6",
    definitionId: "chk_ypt",
    profileId: "prof_demo_staff_1",
    programInstanceId: "inst_cpoi_training_ne",
    status: "complete",
    subStatus: null,
    updatedAt: "2026-08-30T12:00:00.000Z",
    completedAt: "2026-08-30T12:00:00.000Z",
  },
];

/** "Now" for the demo, so overdue/upcoming maths is stable across renders. */
export const DEMO_REFERENCE_DATE = NOW;

/** Hand-written households plus every generated applicant. */
export const ACCOUNTS: readonly Account[] = [...SEED_ACCOUNTS, ...COHORT_ACCOUNTS];
export const PROFILES: readonly Profile[] = [...SEED_PROFILES, ...COHORT_PROFILES];

/** Just the hand-written ones, for tests that assert on the curated household. */
export { SEED_ACCOUNTS, SEED_PROFILES };

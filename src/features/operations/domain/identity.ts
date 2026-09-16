import type { Id, IsoDate, IsoDateTime, Metadata } from "./common";
import type { RegionId } from "./region";

/**
 * Accounts, profiles and the links between them.
 *
 * ## The model, and why
 *
 * The 09-09 call settled on the shape IUSA already proved: **one login holds a
 * household, and you apply *as* a profile within it**. A parent signs in once
 * and switches between their children rather than keeping an account per child.
 *
 * Three records stay separate, which is the part that is easy to lose:
 *
 * - `Account` — how someone signs in. Holds household-level facts that do not
 *   vary by member: address, region, Jamatkhana, phone.
 * - `Profile` — a household member you can apply as. Holds the facts that
 *   *do* vary and that eligibility is decided on: date of birth, rising
 *   grades, school.
 * - `Person` (see `people.ts`) — the canonical identity Operations sees. A
 *   profile points at one, but a profile is not a person: the same person can
 *   be reached from a parent's household and from their own account once they
 *   are old enough to have one.
 *
 * Keeping `Person` underneath is what makes the rest work. A participant who
 * ages into their own account, a volunteer who is also a parent, and a teen
 * who appears in two separated parents' households are all one person with one
 * history — which is exactly what the merge of IUSA and Luma has to get right.
 */

export type AccountStatus = "email_unverified" | "onboarding" | "active" | "suspended" | "closed";

/**
 * A login.
 *
 * Address lives here rather than on a profile because it is a household fact,
 * and because the call decided the *application* should stop asking for a
 * street address at all — city/region is enough to apply, and the full address
 * is collected later on the health form, where there is a reason to hold it.
 */
export interface Account {
  readonly id: Id;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly status: AccountStatus;
  readonly phone: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly regionId: RegionId | null;
  readonly jamatkhana: string | null;
  readonly createdAt: IsoDateTime;
  readonly lastSignInAt: IsoDateTime | null;
  readonly metadata?: Metadata;
}

/**
 * How firmly a profile is tied to a canonical `Person`.
 *
 * `provisional` is the ordinary state for a newly added child: real enough to
 * apply with, not yet trusted enough to unlock an existing person's history.
 * Nothing shows a profile another person's records until it is `verified`.
 */
export type PersonLinkStatus = "provisional" | "pending_match" | "verified" | "disputed";

/**
 * Whether the profile is the account holder or someone in their household.
 *
 * Deliberately not a role: the same profile may apply as a participant one
 * year and as staff the next, and both are recorded as program assignments
 * rather than as a property of the person.
 */
export type ProfileKind = "self" | "household_member";

/**
 * A household member you can apply as.
 *
 * The grade fields are the reason this record exists. Camps do not agree on
 * how to express eligibility — Embark works in rising secular grades, Al-Ummah
 * in ages, others in REC grades — so all three are captured once here and each
 * camp's criteria are evaluated against whichever it uses. See `eligibility.ts`.
 */
export interface Profile {
  readonly id: Id;
  readonly accountId: Id;
  /** The canonical person this profile resolves to, once resolved. */
  readonly personId: Id | null;
  readonly personLinkStatus: PersonLinkStatus;
  readonly kind: ProfileKind;
  readonly legalFirstName: string;
  readonly legalLastName: string;
  readonly preferredName: string | null;
  readonly dateOfBirth: IsoDate | null;
  /** Secular grade in the coming school year, 0 = kindergarten. */
  readonly risingSecularGrade: number | null;
  /** Religious education grade in the coming year. */
  readonly risingRecGrade: number | null;
  readonly schoolName: string | null;
  readonly schoolType: SchoolType | null;
  readonly languages: readonly LanguageProficiency[];
  readonly needsTranslator: boolean;
  /** Present only once the profile has its own login. */
  readonly ownAccountId: Id | null;
  readonly createdAt: IsoDateTime;
  readonly metadata?: Metadata;
}

/**
 * Kept because it earns its place: the call confirmed school name and type are
 * used to read socioeconomic reach across camps, which is a stated equity
 * goal. Street address was dropped in the same conversation for the opposite
 * reason — nothing was being done with it.
 */
export type SchoolType = "public" | "private" | "charter" | "parochial" | "home" | "other";

export type ProficiencyLevel = "basic" | "conversational" | "fluent" | "native";

export interface LanguageProficiency {
  readonly language: string;
  readonly level: ProficiencyLevel;
}

/**
 * How one profile is related to another.
 *
 * Stored apart from what the relationship *allows*, per the Person-Linking
 * doc: being named an emergency contact says who you are to a child, not that
 * you may sign their waivers.
 */
export type RelationshipKind =
  | "parent"
  | "legal_guardian"
  | "foster_guardian"
  | "emergency_contact"
  | "authorized_pickup"
  | "sibling";

export type RelationshipVerification =
  "self_asserted" | "pending_verification" | "verified" | "rejected" | "revoked" | "expired";

export interface PersonRelationship {
  readonly id: Id;
  readonly fromProfileId: Id;
  readonly toProfileId: Id;
  readonly kind: RelationshipKind;
  readonly verification: RelationshipVerification;
  readonly createdAt: IsoDateTime;
}

/**
 * What a relationship actually permits, for one child and one program.
 *
 * Separate from the relationship so access can be narrowed, time-boxed or
 * revoked without rewriting who someone is — which matters most in the cases
 * nobody wants to handle by hand: custody changes, a guardian who may see
 * payment status but not health detail, a participant who turns eighteen.
 */
export type GrantedAction =
  | "complete_forms"
  | "sign_waivers"
  | "manage_registration"
  | "view_payment_status"
  | "receive_communications"
  | "view_health";

export interface RelationshipAccessGrant {
  readonly id: Id;
  readonly relationshipId: Id;
  readonly subjectProfileId: Id;
  /** `null` means the grant is not limited to one program. */
  readonly programId: Id | null;
  readonly actions: readonly GrantedAction[];
  readonly grantedAt: IsoDateTime;
  readonly expiresAt: IsoDate | null;
  readonly revokedAt: IsoDateTime | null;
}

/**
 * What happened when an account was checked against existing people.
 *
 * The four outcomes come straight from the Person-Linking doc, and the rule
 * behind them is the important one: matching may *link*, but it may never
 * reveal. An uncertain match lets the user carry on and shows them nothing of
 * the record they might be, because the cost of guessing wrong is exposing one
 * family's data to another.
 */
export type MatchOutcome = "confirmed" | "no_match" | "uncertain" | "conflict";

export type MatchEvidence =
  | "invitation_token"
  | "external_id"
  | "verified_email"
  | "email_and_phone"
  | "name_and_dob"
  | "name_only";

export type MatchReviewStatus = "open" | "linked" | "rejected" | "merged";

export interface MatchReview {
  readonly id: Id;
  readonly accountId: Id;
  readonly profileId: Id;
  /** The person this might be. Never shown to the requesting user. */
  readonly candidatePersonId: Id;
  readonly candidateLabel: string;
  readonly outcome: MatchOutcome;
  readonly evidence: readonly MatchEvidence[];
  /** 0–1. Presentational only: a number never links a record on its own. */
  readonly confidence: number;
  readonly status: MatchReviewStatus;
  readonly raisedAt: IsoDateTime;
  readonly resolvedAt: IsoDateTime | null;
  readonly resolvedByPersonId: Id | null;
  readonly note: string | null;
}

export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

/**
 * An invitation to claim a profile or an Operations role.
 *
 * The strongest matching evidence there is: the invitation was sent to a known
 * person, so accepting it links without guessing.
 */
export interface Invitation {
  readonly id: Id;
  readonly email: string;
  readonly invitedPersonId: Id | null;
  readonly invitedProfileId: Id | null;
  readonly purpose: "claim_profile" | "second_guardian" | "operations_role";
  readonly status: InvitationStatus;
  readonly sentAt: IsoDateTime;
  readonly expiresAt: IsoDate;
  readonly acceptedAt: IsoDateTime | null;
}

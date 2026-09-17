import type {
  GrantedAction,
  IsoDate,
  PersonRelationship,
  Profile,
  RelationshipAccessGrant,
  RelationshipKind,
  RelationshipVerification,
} from "@/features/operations/domain";

import { profileDisplayName } from "./household-view";

/**
 * Turning relationships and access grants into something a parent can read.
 *
 * `identity.ts` keeps the two apart on purpose: who you are to a child is one
 * record, what you may do for them is another. That separation is invisible
 * until someone draws it, and every custody conversation JMC has ever had
 * turns on it — a grandparent may be an authorized pickup and have no business
 * reading a health form; a second guardian may be verified for one camp only.
 *
 * So the portal shows two things rather than one merged permissions blob: the
 * relationship, and then, separately, the actions. This module does the join
 * and, more usefully, works out what is *not* granted — the omissions are the
 * part that proves the model is real.
 */

/** Presentation order, loosely least to most sensitive. */
export const GRANTED_ACTIONS: readonly GrantedAction[] = [
  "receive_communications",
  "view_payment_status",
  "complete_forms",
  "manage_registration",
  "sign_waivers",
  "view_health",
];

export const GRANTED_ACTION_LABELS: Readonly<Record<GrantedAction, string>> = {
  receive_communications: "Receive communications",
  view_payment_status: "See payment status",
  complete_forms: "Complete forms",
  manage_registration: "Manage the registration",
  sign_waivers: "Sign waivers",
  view_health: "See health information",
};

export const RELATIONSHIP_LABELS: Readonly<Record<RelationshipKind, string>> = {
  parent: "Parent",
  legal_guardian: "Legal guardian",
  foster_guardian: "Foster guardian",
  emergency_contact: "Emergency contact",
  authorized_pickup: "Authorized pickup",
  sibling: "Sibling",
};

export const VERIFICATION_LABELS: Readonly<Record<RelationshipVerification, string>> = {
  self_asserted: "Stated by the account holder",
  pending_verification: "Awaiting verification",
  verified: "Verified",
  rejected: "Rejected",
  revoked: "Revoked",
  expired: "Expired",
};

/**
 * A grant that has been revoked or has passed its end date is not a grant.
 * Checked against a date passed in rather than a clock, so the same data
 * renders the same way on the server and after hydration.
 */
export function isGrantLive(grant: RelationshipAccessGrant, today: IsoDate): boolean {
  if (grant.revokedAt !== null) return false;
  return grant.expiresAt === null || grant.expiresAt >= today;
}

/** One guardian's standing access to one child, with the gaps made explicit. */
export interface AccessRow {
  readonly id: string;
  readonly subjectProfileId: string;
  readonly subjectName: string;
  readonly holderProfileId: string;
  readonly holderName: string;
  readonly kind: RelationshipKind;
  readonly verification: RelationshipVerification;
  /** `null` when the grant covers every program. */
  readonly programId: string | null;
  readonly granted: readonly GrantedAction[];
  /** Everything the grant does not include — the point of the whole screen. */
  readonly withheld: readonly GrantedAction[];
  readonly expiresAt: IsoDate | null;
  readonly live: boolean;
}

/** A relationship with no live grant behind it: known, but not yet permitted. */
export interface UngrantedRelationship {
  readonly relationship: PersonRelationship;
  readonly holderName: string;
  readonly subjectName: string;
}

export interface AccessView {
  readonly rows: readonly AccessRow[];
  readonly ungranted: readonly UngrantedRelationship[];
}

/**
 * Joins profiles, relationships and grants into the rows the household screen
 * renders. A grant whose relationship has gone missing is dropped rather than
 * shown against an unknown person — a permissions table that renders "Unknown"
 * in the subject column is worse than one row shorter.
 */
export function buildAccessView(
  profiles: readonly Profile[],
  relationships: readonly PersonRelationship[],
  grants: readonly RelationshipAccessGrant[],
  today: IsoDate,
): AccessView {
  const names = new Map(profiles.map((profile) => [profile.id, profileDisplayName(profile)]));
  const byRelationship = new Map(relationships.map((entry) => [entry.id, entry]));

  const rows: AccessRow[] = [];
  const grantedRelationshipIds = new Set<string>();

  for (const grant of grants) {
    const relationship = byRelationship.get(grant.relationshipId);
    if (!relationship) continue;

    const live = isGrantLive(grant, today);
    if (live) grantedRelationshipIds.add(relationship.id);

    const granted = GRANTED_ACTIONS.filter((action) => grant.actions.includes(action));
    rows.push({
      id: grant.id,
      subjectProfileId: grant.subjectProfileId,
      subjectName: names.get(grant.subjectProfileId) ?? "Unknown member",
      holderProfileId: relationship.fromProfileId,
      holderName: names.get(relationship.fromProfileId) ?? "Unknown member",
      kind: relationship.kind,
      verification: relationship.verification,
      programId: grant.programId,
      granted,
      withheld: GRANTED_ACTIONS.filter((action) => !grant.actions.includes(action)),
      expiresAt: grant.expiresAt,
      live,
    });
  }

  const ungranted = relationships
    .filter((relationship) => !grantedRelationshipIds.has(relationship.id))
    .map((relationship) => ({
      relationship,
      holderName: names.get(relationship.fromProfileId) ?? "Unknown member",
      subjectName: names.get(relationship.toProfileId) ?? "Unknown member",
    }));

  return { rows, ungranted };
}

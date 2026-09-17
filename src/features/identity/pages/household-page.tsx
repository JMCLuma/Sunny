import { Link } from "@tanstack/react-router";
import { ChevronRight, Plus, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HouseholdOverview, ProfileDraft } from "@/features/operations/data";
import type {
  Id,
  IsoDate,
  MatchOutcome,
  PersonRelationship,
  Profile,
  RelationshipAccessGrant,
} from "@/features/operations/domain";

import {
  buildAccessView,
  GRANTED_ACTION_LABELS,
  RELATIONSHIP_LABELS,
  VERIFICATION_LABELS,
} from "../access-view";
import { MatchOutcomeCard } from "../components/match-outcome-card";
import { PortalSection } from "../components/portal-section";
import { ProfileFormFields } from "../components/profile-form-fields";
// Page furniture (back link, empty state) is generic My Luma chrome, not
// portal-specific — reused rather than duplicated a second time.
import { PortalEmptyState } from "@/features/portal/components/portal-empty-state";
import { PortalPageHeader } from "@/features/portal/components/portal-page-header";
import { profileDisplayName, profileInitials } from "../household-view";
import { emptyProfileDraft, validateProfileDraft } from "../profile-draft";

/** An open review's outcome, keyed by the profile it is about. */
export type PendingOutcomes = ReadonlyMap<Id, MatchOutcome>;

export function HouseholdPage({
  overview,
  relationships,
  grants,
  today,
  pendingOutcomes,
  onAddProfile,
}: {
  overview: HouseholdOverview | null;
  relationships: readonly PersonRelationship[];
  grants: readonly RelationshipAccessGrant[];
  today: IsoDate;
  pendingOutcomes: PendingOutcomes;
  onAddProfile: (draft: ProfileDraft) => Promise<Profile>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [saving, setSaving] = useState(false);
  const [justAdded, setJustAdded] = useState<{ profile: Profile } | null>(null);

  if (!overview) {
    return (
      <PortalEmptyState icon={Users} title="No household on this account">
        <p>
          This persona is not signed in to a family household, so there is nothing to manage here.
          Switch to the Parent persona in the demo bar to see one.
        </p>
      </PortalEmptyState>
    );
  }

  const profiles = overview.profiles.map((summary) => summary.profile);
  const access = buildAccessView(profiles, relationships, grants, today);
  const validation = validateProfileDraft(draft);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validation.valid) return;
    setSaving(true);
    try {
      const profile = await onAddProfile(draft);
      setJustAdded({ profile });
      setDraft(emptyProfileDraft());
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Family"
        description="Everyone in your household, and — separately — who may act for whom."
        backTo="/my"
        backLabel="Overview"
      />

      {justAdded ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {profileDisplayName(justAdded.profile)} was added to your household.
          </p>
          <MatchOutcomeCard
            outcome={pendingOutcomes.get(justAdded.profile.id) ?? "no_match"}
            highlight
          />
        </div>
      ) : null}

      <PortalSection
        id="members"
        title="Household members"
        description="Add a profile for each person you'll apply on behalf of."
        action={
          <Button size="sm" variant="secondary" onClick={() => setShowAdd((value) => !value)}>
            <UserPlus aria-hidden className="size-4" />
            {showAdd ? "Cancel" : "Add a member"}
          </Button>
        }
      >
        <ul className="space-y-3">
          {profiles.map((profile) => {
            const summary = overview.profiles.find((entry) => entry.profile.id === profile.id)!;
            const reviewOutcome = pendingOutcomes.get(profile.id);
            return (
              <li
                key={profile.id}
                className="rounded-lg border border-border bg-background p-3 sm:p-4"
              >
                <Link
                  to="/my/household/$profileId"
                  params={{ profileId: profile.id }}
                  className="flex items-center gap-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                    {profileInitials(profile)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className="font-semibold">{profileDisplayName(profile)}</span>
                      {profile.kind === "self" ? <Badge variant="outline">You</Badge> : null}
                      {profile.personLinkStatus === "pending_match" ? (
                        <Badge variant="secondary">Under review</Badge>
                      ) : null}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {summary.age !== null ? `${summary.age} years old` : "Age not recorded"}
                      {summary.checklistItemsNeedingAction > 0
                        ? ` · ${summary.checklistItemsNeedingAction} item${summary.checklistItemsNeedingAction === 1 ? "" : "s"} need${summary.checklistItemsNeedingAction === 1 ? "s" : ""} attention`
                        : ""}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
                  />
                </Link>
                {reviewOutcome ? (
                  <div className="mt-3">
                    <MatchOutcomeCard outcome={reviewOutcome} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {showAdd ? (
          <form
            onSubmit={handleAdd}
            className="mt-4 space-y-4 rounded-lg border border-dashed border-border p-3 sm:p-4"
          >
            <ProfileFormFields draft={draft} onChange={setDraft} idPrefix="add-member" />
            {validation.warnings.length > 0 ? (
              <ul className="space-y-1 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                {validation.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={!validation.valid || saving}
            >
              <Plus aria-hidden className="size-4" />
              {saving ? "Checking for existing records…" : "Add to household"}
            </Button>
          </form>
        ) : null}
      </PortalSection>

      <PortalSection
        id="access"
        title="Who may act for whom"
        description="Being related to a child is one fact; what that relationship allows is another, and each is shown separately on purpose."
      >
        {access.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No access grants recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {access.rows.map((row) => (
              <li key={row.id} className="rounded-lg border border-border p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">
                    <span className="font-semibold">{row.holderName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      is {RELATIONSHIP_LABELS[row.kind].toLowerCase()} to{" "}
                    </span>
                    <span className="font-semibold">{row.subjectName}</span>
                  </p>
                  <Badge variant={row.live ? "secondary" : "outline"}>
                    {row.live ? VERIFICATION_LABELS[row.verification] : "Expired or revoked"}
                  </Badge>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <ShieldCheck aria-hidden className="size-3.5" />
                      May do
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {row.granted.length === 0 ? (
                        <li className="text-sm text-muted-foreground">Nothing yet</li>
                      ) : (
                        row.granted.map((action) => (
                          <li
                            key={action}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {GRANTED_ACTION_LABELS[action]}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      May not do
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {row.withheld.length === 0 ? (
                        <li className="text-sm text-muted-foreground">Everything is granted</li>
                      ) : (
                        row.withheld.map((action) => (
                          <li
                            key={action}
                            className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {GRANTED_ACTION_LABELS[action]}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {access.ungranted.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {access.ungranted.length} relationship{access.ungranted.length === 1 ? "" : "s"}{" "}
            recorded with no standing access yet.
          </p>
        ) : null}
      </PortalSection>
    </div>
  );
}

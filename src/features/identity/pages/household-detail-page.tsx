import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProfileDraft } from "@/features/operations/data";
import type { MatchOutcome, Profile } from "@/features/operations/domain";

import {
  GRANTED_ACTION_LABELS,
  RELATIONSHIP_LABELS,
  VERIFICATION_LABELS,
  type AccessRow,
} from "../access-view";
import { Callout } from "../components/callout";
import { Fact, FactList } from "../components/fact-list";
import { MatchOutcomeCard } from "../components/match-outcome-card";
import { PortalSection } from "../components/portal-section";
import { ProfileFormFields } from "../components/profile-form-fields";
import { profileDisplayName } from "../household-view";
import { FIELD_PURPOSE, gradeLabel, profileToDraft, validateProfileDraft } from "../profile-draft";
import { PortalPageHeader } from "@/features/portal/components/portal-page-header";

const SCHOOL_TYPE_LABELS: Readonly<Record<string, string>> = {
  public: "Public",
  private: "Private",
  charter: "Charter",
  parochial: "Parochial",
  home: "Home school",
  other: "Other",
};

/**
 * One profile's detail: the fields eligibility is actually decided on, each
 * one labelled with why it is asked, plus who may act on this child's behalf.
 *
 * Deliberately not just a form. `FIELD_PURPOSE` exists because "why are you
 * asking my child's school?" is a real support email, and the honest answer
 * belongs on the screen that asks the question, not in a policy nobody reads.
 */
export function HouseholdDetailPage({
  profile,
  age,
  accessRows,
  reviewOutcome,
  onSave,
}: {
  profile: Profile;
  age: number | null;
  /** Rows of `buildAccessView` naming this profile as the subject. */
  accessRows: readonly AccessRow[];
  /** The open match review's outcome, when this profile is `pending_match`. */
  reviewOutcome: MatchOutcome | null;
  onSave: (patch: Partial<ProfileDraft>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(() => profileToDraft(profile));
  const [saving, setSaving] = useState(false);
  const validation = validateProfileDraft(draft);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validation.valid) return;
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title={profileDisplayName(profile)}
        backTo="/my/household"
        backLabel="Family"
        {...(profile.preferredName
          ? { description: `Legal name: ${profile.legalFirstName} ${profile.legalLastName}` }
          : {})}
        {...(age !== null ? { meta: `${age} years old` } : {})}
      />

      {profile.personLinkStatus === "pending_match" && reviewOutcome ? (
        <MatchOutcomeCard outcome={reviewOutcome} highlight />
      ) : null}

      <PortalSection
        id="details"
        title="What we hold, and why"
        description="Two kinds of field: some decide which camps this profile can apply to, the rest are only read afterwards."
        action={
          editing ? null : (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )
        }
      >
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <ProfileFormFields draft={draft} onChange={setDraft} idPrefix="edit-profile" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDraft(profileToDraft(profile));
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={!validation.valid || saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        ) : (
          <FactList>
            <Fact
              label={FIELD_PURPOSE.dateOfBirth.label}
              value={profile.dateOfBirth ?? "Not recorded"}
              hint={FIELD_PURPOSE.dateOfBirth.why}
            />
            <Fact
              label={FIELD_PURPOSE.risingSecularGrade.label}
              value={gradeLabel(profile.risingSecularGrade)}
              hint={FIELD_PURPOSE.risingSecularGrade.why}
            />
            <Fact
              label={FIELD_PURPOSE.risingRecGrade.label}
              value={gradeLabel(profile.risingRecGrade)}
              hint={FIELD_PURPOSE.risingRecGrade.why}
            />
            <Fact
              label={FIELD_PURPOSE.school.label}
              value={
                profile.schoolName
                  ? `${profile.schoolName}${profile.schoolType ? ` (${SCHOOL_TYPE_LABELS[profile.schoolType]})` : ""}`
                  : "Not recorded"
              }
              hint={FIELD_PURPOSE.school.why}
              span
            />
            <Fact
              label={FIELD_PURPOSE.languages.label}
              value={
                profile.languages.length === 0
                  ? "None recorded"
                  : profile.languages.map((entry) => entry.language).join(", ")
              }
              hint={FIELD_PURPOSE.languages.why}
            />
            <Fact
              label={FIELD_PURPOSE.needsTranslator.label}
              value={profile.needsTranslator ? "Yes" : "No"}
              hint={FIELD_PURPOSE.needsTranslator.why}
            />
          </FactList>
        )}
      </PortalSection>

      <PortalSection
        id="access"
        title={`Who may act for ${profileDisplayName(profile)}`}
        description="A relationship says who someone is to this child; a grant says what they may actually do, and the two are tracked separately."
      >
        {accessRows.length === 0 ? (
          <Callout tone="info">No one holds standing access to this profile yet.</Callout>
        ) : (
          <ul className="space-y-3">
            {accessRows.map((row) => (
              <li key={row.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {row.holderName}
                    <span className="ms-1.5 font-normal text-muted-foreground">
                      · {RELATIONSHIP_LABELS[row.kind]}
                    </span>
                  </p>
                  <Badge variant={row.live ? "secondary" : "outline"}>
                    {row.live ? VERIFICATION_LABELS[row.verification] : "Expired or revoked"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  May:{" "}
                  {row.granted.length > 0
                    ? row.granted.map((action) => GRANTED_ACTION_LABELS[action]).join(", ")
                    : "nothing yet"}
                </p>
                {row.withheld.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    May not:{" "}
                    {row.withheld.map((action) => GRANTED_ACTION_LABELS[action]).join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </PortalSection>
    </div>
  );
}

import { Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PortalEmptyState } from "@/features/portal/components/portal-empty-state";
import { PortalPageHeader } from "@/features/portal/components/portal-page-header";
import { PortalSection } from "@/features/portal/components/portal-section";
import {
  ageAt,
  type EligibilityAudience,
  type Id,
  type Profile,
} from "@/features/operations/domain";
import type { EligibleInstanceRow } from "@/features/operations/data";
import { cn } from "@/lib/utils";

import { EligibleInstanceCard } from "../components/eligible-instance-card";
import {
  groupEligibleInstances,
  profileDisplayName,
  selectableRows,
  type EligibleInstanceGroups,
} from "../view-models";

/**
 * "Which camps can this person actually go to?" — the whole reason this
 * screen exists. The 09-09 call's example was a Houston family filling out
 * eight speculative Mosaic applications; the fix is filtering by eligibility,
 * not hiding it. Every camp a profile could name appears here, eligible or
 * not, with the reason attached — see `EligibleInstanceCard`.
 */
export function ApplyPage({
  accountId,
  profiles,
  selectedProfileId,
  participantRows,
  staffRows,
  referenceDate,
  onSelectProfile,
  onStartApplications,
}: {
  accountId: Id | null;
  profiles: readonly Profile[];
  selectedProfileId: Id | null;
  participantRows: readonly EligibleInstanceRow[];
  staffRows: readonly EligibleInstanceRow[];
  referenceDate: string;
  onSelectProfile: (profileId: Id) => void;
  onStartApplications: (rows: readonly EligibleInstanceRow[]) => Promise<void>;
}) {
  if (!accountId) {
    return (
      <div className="space-y-6">
        <PortalPageHeader title="Apply to a camp" />
        <PortalEmptyState icon={Users} title="No household is signed in">
          Applying is something a family account does for its own members. Switch to a parent, adult
          participant or staff-applicant persona to see this screen.
        </PortalEmptyState>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="space-y-6">
        <PortalPageHeader title="Apply to a camp" />
        <PortalEmptyState icon={Users} title="No one to apply for yet">
          Add a household member first, then come back here to see what they can apply to.
        </PortalEmptyState>
      </div>
    );
  }

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? null;

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Apply to a camp"
        description="Pick who's applying, then choose from the camps they're eligible for."
        backTo="/my/applications"
        backLabel="Applications"
      />

      <PortalSection id="apply-who" title="Who's applying?">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Household member">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              role="radio"
              aria-checked={profile.id === selectedProfileId}
              onClick={() => onSelectProfile(profile.id)}
              className={cn(
                "rounded-md border px-3 py-2 text-start text-sm font-medium transition-colors",
                profile.id === selectedProfileId
                  ? "border-primary bg-secondary text-secondary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {profileDisplayName(profile)}
              {profile.kind === "self" ? (
                <span className="ms-1 font-normal text-muted-foreground">(you)</span>
              ) : null}
            </button>
          ))}
        </div>
      </PortalSection>

      {selectedProfile ? (
        <ProfileCampList
          profile={selectedProfile}
          participantRows={participantRows}
          staffRows={staffRows}
          referenceDate={referenceDate}
          onStartApplications={onStartApplications}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Choose someone above to see their camps.</p>
      )}
    </div>
  );
}

function ProfileCampList({
  profile,
  participantRows,
  staffRows,
  referenceDate,
  onStartApplications,
}: {
  profile: Profile;
  participantRows: readonly EligibleInstanceRow[];
  staffRows: readonly EligibleInstanceRow[];
  referenceDate: string;
  onStartApplications: (rows: readonly EligibleInstanceRow[]) => Promise<void>;
}) {
  const age = profile.dateOfBirth ? ageAt(profile.dateOfBirth, referenceDate.slice(0, 10)) : null;
  const allAudiences: readonly {
    label: string;
    audience: EligibilityAudience;
    rows: readonly EligibleInstanceRow[];
  }[] = [
    { label: "As a participant", audience: "participant", rows: participantRows },
    { label: "As staff", audience: "staff", rows: staffRows },
  ];
  const audiences = allAudiences.filter((entry) => entry.rows.length > 0);

  if (audiences.length === 0) {
    return (
      <PortalEmptyState icon={Users} title="No camps configured yet">
        There is nothing in the catalogue for {profileDisplayName(profile)} to apply to right now.
      </PortalEmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {profileDisplayName(profile)}
        {age !== null ? `, age ${age}` : ""}
      </p>
      {audiences.map((entry) => (
        <AudienceGroup key={entry.audience} {...entry} onStartApplications={onStartApplications} />
      ))}
    </div>
  );
}

function AudienceGroup({
  label,
  rows,
  onStartApplications,
}: {
  label: string;
  audience: EligibilityAudience;
  rows: readonly EligibleInstanceRow[];
  onStartApplications: (rows: readonly EligibleInstanceRow[]) => Promise<void>;
}) {
  const groups: EligibleInstanceGroups = groupEligibleInstances(rows);
  const ordered = [...groups.open, ...groups.needsDetail, ...groups.notEligible];
  const eligibleForStart = selectableRows(rows);

  const [selected, setSelected] = useState<ReadonlySet<Id>>(new Set());
  const [starting, setStarting] = useState(false);

  function toggle(formId: Id, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(formId);
      else next.delete(formId);
      return next;
    });
  }

  async function handleStart() {
    const rowsToStart = eligibleForStart.filter((row) => row.formId && selected.has(row.formId));
    if (rowsToStart.length === 0) return;
    setStarting(true);
    try {
      await onStartApplications(rowsToStart);
    } finally {
      setStarting(false);
    }
  }

  return (
    <PortalSection id={`apply-${label}`} title={label}>
      <ul className="space-y-3">
        {ordered.map((row) => (
          <EligibleInstanceCard
            key={row.instance.id}
            row={row}
            selectable={eligibleForStart.some((entry) => entry.instance.id === row.instance.id)}
            selected={row.formId !== null && selected.has(row.formId)}
            onToggleSelected={(checked) => row.formId && toggle(row.formId, checked)}
          />
        ))}
      </ul>

      {eligibleForStart.length > 0 ? (
        <Button className="mt-4" disabled={selected.size === 0 || starting} onClick={handleStart}>
          {starting
            ? "Starting…"
            : selected.size === 0
              ? "Start application"
              : `Start ${selected.size} application${selected.size === 1 ? "" : "s"}`}
        </Button>
      ) : null}
    </PortalSection>
  );
}

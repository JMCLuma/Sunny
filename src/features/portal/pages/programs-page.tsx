import { CalendarCheck } from "lucide-react";

import type { ChecklistView } from "@/features/operations/data";

import { CampChecklistCard } from "../components/camp-checklist-card";
import { PortalEmptyState } from "../components/portal-empty-state";
import { PortalPageHeader } from "../components/portal-page-header";

/**
 * "My camps" — every accepted place, each with its own checklist.
 *
 * This is the screen that replaces six emails pointing at six places: one
 * card per accepted child-and-camp pairing, each summarising what is left and
 * linking to the full checklist. `CampChecklistCard` already does the whole
 * job, so the page's only work is deciding what to show when there is
 * nothing yet.
 */
export function ProgramsPage({ views }: { views: readonly ChecklistView[] }) {
  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="My camps"
        description="Everything an accepted place still needs, in one list with deadlines."
      />

      {views.length === 0 ? (
        <PortalEmptyState icon={CalendarCheck} title="Nothing accepted yet">
          <p>
            Once an application is accepted, its checklist — health forms, waivers, travel and
            payment — will show up here.
          </p>
        </PortalEmptyState>
      ) : (
        <ul className="space-y-4">
          {views.map((view) => (
            <CampChecklistCard key={`${view.profileId}:${view.programInstanceId}`} view={view} />
          ))}
        </ul>
      )}
    </div>
  );
}

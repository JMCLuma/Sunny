import type { ChecklistView } from "@/features/operations/data";

import { groupChecklistEntries } from "../checklist-view";
import { ChecklistItemRow } from "../components/checklist-item-row";
import { ChecklistProgressBar } from "../components/checklist-progress";
import { PortalPageHeader } from "../components/portal-page-header";
import { PortalSection } from "../components/portal-section";

/**
 * One camp's checklist, grouped by whose turn it is.
 *
 * `groupChecklistEntries` already decided the three piles and their order;
 * this page only renders them and wires "mark as done" to the write the
 * route was given. Only items that are actually the family's turn
 * (`action`) get that control — an item the camp is reviewing has no button
 * a parent could press to speed it up, and pretending otherwise is worse
 * than leaving it out.
 */
export function ChecklistPage({
  view,
  onComplete,
}: {
  view: ChecklistView;
  onComplete: (definitionId: string) => void;
}) {
  const groups = groupChecklistEntries(view.entries);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title={`${view.programName} checklist`}
        backTo="/my/programs"
        backLabel="My camps"
        meta={`${view.profileName} · ${view.instanceName}`}
      />

      <PortalSection id="progress" title="Progress">
        <ChecklistProgressBar completed={view.completed} total={view.total} />
      </PortalSection>

      {groups.map((group) => (
        <PortalSection
          key={group.id}
          id={group.id}
          title={group.title}
          description={group.description}
        >
          <ul className="space-y-3">
            {group.entries.map((entry) => (
              <ChecklistItemRow
                key={entry.definition.id}
                entry={entry}
                {...(group.id === "action" ? { onComplete } : {})}
              />
            ))}
          </ul>
        </PortalSection>
      ))}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Home,
  Mail,
  TriangleAlert,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HouseholdOverview } from "@/features/operations/data";
import { formatDate } from "@/features/operations/format";

import {
  buildActionQueue,
  laterDeadlines,
  partitionSubmissions,
  profileDisplayName,
  profileInitials,
  type ActionItem,
  type ActionTone,
} from "@/features/identity/household-view";

import { PortalEmptyState } from "../components/portal-empty-state";
import { PortalPageHeader } from "../components/portal-page-header";
import { PortalSection } from "../components/portal-section";

/**
 * The household dashboard — the most-visited screen in the product.
 *
 * Its whole job is answering one question honestly: "is there anything I
 * have to do right now?" `buildActionQueue` already did the hard part —
 * merging four unrelated tables into one ordered list — so this page's job
 * is just to render that list first and let everything else be reference.
 */
export function DashboardPage({ overview }: { overview: HouseholdOverview | null }) {
  if (!overview) {
    return (
      <PortalEmptyState icon={Home} title="No household on this account">
        <p>
          This persona is signed in on the Operations side, not as a family. Switch to the Parent,
          Adult participant or Staff applicant persona in the demo bar to see My Luma.
        </p>
      </PortalEmptyState>
    );
  }

  const actionQueue = buildActionQueue(overview);
  const later = laterDeadlines(overview.upcomingDeadlines);
  const { inFlight } = partitionSubmissions(overview.submissions);

  return (
    <div className="space-y-6">
      <PortalPageHeader title="My Luma" description={`Signed in as ${overview.account.email}`} />

      {actionQueue.length > 0 ? (
        <PortalSection
          id="action-queue"
          title="What needs your attention"
          description="Most pressing first — across every child and every camp."
        >
          <ul className="space-y-2">
            {actionQueue.map((item) => (
              <ActionQueueRow key={item.id} item={item} />
            ))}
          </ul>
        </PortalSection>
      ) : (
        <PortalSection id="action-queue" title="What needs your attention">
          <p className="text-sm text-muted-foreground">
            Nothing needs you right now. Anything new will show up here first.
          </p>
        </PortalSection>
      )}

      <PortalSection
        id="household"
        title="Your household"
        description={`${overview.profiles.length} profile${overview.profiles.length === 1 ? "" : "s"}`}
        action={
          <Button asChild size="sm" variant="secondary">
            <Link to="/my/household">
              Manage
              <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        }
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {overview.profiles.map((summary) => (
            <li key={summary.profile.id}>
              <Link
                to="/my/household/$profileId"
                params={{ profileId: summary.profile.id }}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                  {profileInitials(summary.profile)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {profileDisplayName(summary.profile)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {summary.age !== null ? `${summary.age} years old` : "Age not recorded"}
                  </span>
                </span>
                {summary.profile.personLinkStatus === "pending_match" ? (
                  <Badge variant="secondary" className="shrink-0">
                    Review
                  </Badge>
                ) : summary.checklistItemsNeedingAction > 0 ? (
                  <Badge variant="destructive" className="shrink-0">
                    {summary.checklistItemsNeedingAction}
                  </Badge>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </PortalSection>

      {inFlight.length > 0 ? (
        <PortalSection
          id="applications"
          title="Applications in progress"
          action={
            <Button asChild size="sm" variant="secondary">
              <Link to="/my/applications">
                View all
                <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          }
        >
          <ul className="space-y-2">
            {inFlight.map((entry) => (
              <li
                key={entry.submission.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {entry.profileName} · {entry.programName}
                  </span>
                  <span className="block text-xs text-muted-foreground">{entry.instanceName}</span>
                </span>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {entry.submission.status.replace(/_/g, " ")}
                </Badge>
              </li>
            ))}
          </ul>
        </PortalSection>
      ) : null}

      {later.length > 0 ? (
        <PortalSection
          id="calendar"
          title="Coming up"
          description="Deadlines further out than a week — nothing urgent, just so you know it's there."
        >
          <ul className="space-y-2">
            {later.map((deadline) => (
              <li
                key={`${deadline.profileId}:${deadline.label}`}
                className="flex items-center gap-3 text-sm"
              >
                <CalendarClock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {deadline.label} — {deadline.profileName}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatDate(deadline.dueDate)}
                </span>
              </li>
            ))}
          </ul>
        </PortalSection>
      ) : null}

      {overview.invitations.length > 0 ? (
        <PortalSection id="invitations" title="Invitations you've sent">
          <ul className="space-y-2">
            {overview.invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center gap-3 rounded-md border border-dashed border-border p-3 text-sm"
              >
                <Mail aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{invitation.email}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  Expires {formatDate(invitation.expiresAt)}
                </span>
              </li>
            ))}
          </ul>
        </PortalSection>
      ) : null}
    </div>
  );
}

const TONE_ICON: Readonly<Record<ActionTone, typeof TriangleAlert>> = {
  critical: TriangleAlert,
  attention: ClipboardList,
  routine: Users,
};

const TONE_STYLE: Readonly<Record<ActionTone, string>> = {
  critical: "border-s-4 border-s-destructive",
  attention: "border-s-4 border-s-highlight",
  routine: "",
};

function ActionQueueRow({ item }: { item: ActionItem }) {
  const Icon = TONE_ICON[item.tone];
  const content = (
    <div
      className={`flex items-start gap-3 rounded-md border border-border bg-background p-3 ${TONE_STYLE[item.tone]}`}
    >
      <Icon
        aria-hidden
        className={`mt-0.5 size-4 shrink-0 ${item.tone === "critical" ? "text-destructive" : "text-muted-foreground"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.detail}</p>
      </div>
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{item.meta}</span>
    </div>
  );

  if (item.target.kind === "profile") {
    return (
      <li>
        <Link to="/my/household/$profileId" params={{ profileId: item.target.profileId }}>
          {content}
        </Link>
      </li>
    );
  }
  if (item.target.kind === "household") {
    return (
      <li>
        <Link to="/my/household">{content}</Link>
      </li>
    );
  }
  if (item.target.kind === "applications") {
    return (
      <li>
        <Link to="/my/applications">{content}</Link>
      </li>
    );
  }
  return <li>{content}</li>;
}

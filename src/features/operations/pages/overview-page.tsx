import type { OperationsOverview } from "../data";
import { ActivitySection } from "../components/overview/activity-section";
import { AttentionSection } from "../components/overview/attention-section";
import { ComplianceSection } from "../components/overview/compliance-section";
import { FinanceSection } from "../components/overview/finance-section";
import { IntegrationsSection } from "../components/overview/integrations-section";
import { PortfolioSection } from "../components/overview/portfolio-section";
import {
  UpcomingEventsSection,
  UpcomingInstancesSection,
} from "../components/overview/schedule-section";
import { formatDateTime } from "../format";

/**
 * The Operations overview.
 *
 * It receives an already-assembled `OperationsOverview` from the route loader,
 * which got it from the repository — the page joins nothing, fetches nothing
 * and imports no seed data, so the same component renders Supabase-backed data
 * unchanged.
 */
export function OverviewPage({ overview }: { overview: OperationsOverview }) {
  return (
    <div className="space-y-6">
      <PortfolioSection rows={overview.portfolio} />

      <div className="grid gap-6 xl:grid-cols-2">
        <UpcomingInstancesSection rows={overview.upcomingInstances} />
        <UpcomingEventsSection rows={overview.upcomingEvents} />
      </div>

      <AttentionSection tasks={overview.attention} referenceDate={overview.generatedAt} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ComplianceSection rows={overview.complianceReadiness} />
        <FinanceSection rows={overview.financeWorkflow} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ActivitySection events={overview.recentActivity} />
        <IntegrationsSection integrations={overview.integrations} />
      </div>

      <p className="text-xs text-muted-foreground">
        Demonstration data, generated {formatDateTime(overview.generatedAt)}. No real people,
        finances or records are represented.
      </p>
    </div>
  );
}

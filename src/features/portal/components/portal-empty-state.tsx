import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * An empty screen that explains itself.
 *
 * Operations' `EmptyState` is one muted sentence, which is right inside a
 * panel an administrator is scanning past. Here the empty state is often the
 * whole page — a household with no accepted place yet, or an Operations
 * persona who has no household at all — and "No data" would read as a fault.
 * So it gets a heading, a reason, and somewhere to go next.
 */
export function PortalEmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center">
      <Icon aria-hidden className="mx-auto size-8 text-muted-foreground" />
      <h2 className="mt-3 text-base font-bold">{title}</h2>
      {children ? (
        <div className="mx-auto mt-1 max-w-prose text-sm text-muted-foreground">{children}</div>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

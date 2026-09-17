import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A titled region of a My Luma page.
 *
 * Deliberately a near-twin of Operations' `OperationsSection` rather than an
 * import of it: the two surfaces will drift — this one is read on a phone and
 * wants more air — and a shared component that has to serve both ends up
 * serving neither. The accessibility contract is the same in both: a real
 * `<section>` with its `<h2>` bound by `aria-labelledby`, so the page can be
 * navigated by heading rather than by looking at it.
 */
export function PortalSection({
  id,
  title,
  description,
  action,
  className,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("rounded-xl border border-border bg-card p-4 sm:p-6", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-bold text-card-foreground">
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Shown when a section has nothing in it, saying what would appear here. */
export function PortalEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A titled region of a page. Renders a real `<section>` with an `<h2>` bound to
 * it by `aria-labelledby`, so the page outline is navigable by heading rather
 * than by visual grouping alone.
 */
export function OperationsSection({
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
      className={cn("rounded-lg border border-border bg-card p-4 sm:p-5", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={headingId} className="text-base font-bold text-card-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

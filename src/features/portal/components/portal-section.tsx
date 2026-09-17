import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A titled region of a My Luma page.
 *
 * Deliberately not `OperationsSection`, for the same reason the shells differ:
 * an Operations section is one panel among many on a wide screen, while at
 * 360px a portal section *is* the screen. So the padding is smaller, the
 * heading and its action stack rather than sit side by side, and the
 * description is part of the content rather than a subtitle nobody reads.
 *
 * Still a real `<section>` bound to its `<h2>`, so the page outline is
 * navigable by heading and a screen-reader user can skip a section whole.
 */
export function PortalSection({
  id,
  title,
  description,
  action,
  footer,
  className,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("rounded-lg border border-border bg-card p-4 sm:p-5", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-bold text-card-foreground">
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
      {footer ? <div className="mt-4 border-t border-border pt-3">{footer}</div> : null}
    </section>
  );
}

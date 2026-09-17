import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The top of a My Luma page.
 *
 * The back link sits *above* the title rather than beside it. A form page is
 * usually arrived at from one checklist item, and on a phone the way back to
 * that checklist is the second most used control on the screen — putting it in
 * the thumb-reachable top-start corner, on its own line, means it is never the
 * thing that gets squeezed when a camp name runs long.
 *
 * `ChevronLeft` is flipped under RTL: the arrow means "back", and back is on
 * the other side in Farsi, Arabic and Urdu.
 */
export function PortalPageHeader({
  title,
  description,
  backTo,
  backLabel,
  meta,
}: {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  /** A line naming who and which camp this page is for, when it is known. */
  meta?: ReactNode;
}) {
  return (
    <header className="space-y-2">
      {backTo ? (
        <Link
          to={backTo}
          className="-ms-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
          {backLabel ?? "Back"}
        </Link>
      ) : null}

      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {meta ? <div className="text-sm font-medium text-foreground">{meta}</div> : null}
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </header>
  );
}

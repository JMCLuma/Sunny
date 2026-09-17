import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A description list of stored facts.
 *
 * A real `<dl>` rather than a two-column grid of divs, because these screens
 * exist to say "here is what we hold about you" and a screen reader should be
 * able to read the pairing back. Labels stack above values below `sm` so a
 * long value is never squeezed into half of a 360px viewport.
 */
export function FactList({ className, children }: { className?: string; children: ReactNode }) {
  return <dl className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</dl>;
}

export function Fact({
  label,
  value,
  hint,
  span,
}: {
  label: string;
  value: ReactNode;
  /** Why this field is held, when that is not obvious. */
  hint?: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={cn("min-w-0", span && "sm:col-span-2")}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

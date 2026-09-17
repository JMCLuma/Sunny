import { CircleHelp, Info, Lock, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A short statement the family is meant to actually read.
 *
 * Four tones, each earning its own treatment because they say different kinds
 * of thing:
 *
 * - `info` — how something works ("card details never reach us").
 * - `privacy` — what we do with records that are not ours to be casual about.
 * - `caution` — a deadline or a consequence.
 * - `open-question` — a decision the team has not made. This wireframe would
 *   rather draw an unanswered question than quietly answer it and have the
 *   screenshot become the specification. The demo's decisions registry records
 *   the same questions; this is the version the screen itself admits to.
 */
export type PortalNoticeTone = "info" | "privacy" | "caution" | "open-question";

const ICONS: Readonly<Record<PortalNoticeTone, LucideIcon>> = {
  info: Info,
  privacy: Lock,
  caution: TriangleAlert,
  "open-question": CircleHelp,
};

const TONES: Readonly<Record<PortalNoticeTone, string>> = {
  info: "border-border bg-muted/50 text-foreground",
  privacy: "border-primary/30 bg-secondary text-secondary-foreground",
  caution: "border-destructive/40 bg-destructive/10 text-foreground",
  "open-question": "border-highlight bg-highlight/20 text-foreground",
};

export function PortalNotice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: PortalNoticeTone;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = ICONS[tone];

  return (
    <div className={cn("flex gap-3 rounded-md border p-3 text-sm", TONES[tone], className)}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{title}</p>
        {children ? <div className="text-sm leading-relaxed">{children}</div> : null}
      </div>
    </div>
  );
}

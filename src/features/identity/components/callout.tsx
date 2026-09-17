import { CircleAlert, EyeOff, Info, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A short aside that explains a rule.
 *
 * These screens carry an unusual amount of explanation — what verifying an
 * email does and does not prove, why a match is not shown, why the address is
 * only a city — and that explanation is the product, not filler. So it gets a
 * real component with a border and an icon rather than being smuggled into
 * muted paragraph text where nobody reads it.
 *
 * Built locally rather than on `ui/alert`, which positions its icon with
 * `left-4` and pads with `pl-7`. Those are physical properties and this
 * platform renders right-to-left for Farsi, Arabic and Urdu; the icon would
 * sit on the wrong side of every Farsi page.
 */
export type CalloutTone = "info" | "privacy" | "warning" | "assurance";

const ICONS: Readonly<Record<CalloutTone, LucideIcon>> = {
  info: Info,
  privacy: EyeOff,
  warning: CircleAlert,
  assurance: ShieldCheck,
};

const TONES: Readonly<Record<CalloutTone, string>> = {
  info: "border-border bg-muted/40 text-foreground",
  privacy: "border-primary/30 bg-primary/5 text-foreground",
  warning: "border-destructive/40 bg-destructive/5 text-foreground",
  assurance: "border-border bg-card text-foreground",
};

const ICON_TONES: Readonly<Record<CalloutTone, string>> = {
  info: "text-muted-foreground",
  privacy: "text-primary",
  warning: "text-destructive",
  assurance: "text-muted-foreground",
};

export function Callout({
  tone = "info",
  title,
  className,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  const Icon = ICONS[tone];

  return (
    <div className={cn("flex gap-3 rounded-lg border p-4 text-sm", TONES[tone], className)}>
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", ICON_TONES[tone])} />
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-muted-foreground [&_strong]:text-foreground">{children}</div>
      </div>
    </div>
  );
}

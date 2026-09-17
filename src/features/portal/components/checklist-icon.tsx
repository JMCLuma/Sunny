import {
  Backpack,
  BadgeCheck,
  CreditCard,
  FileSignature,
  HeartPulse,
  ListChecks,
  Plane,
  ShieldCheck,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The icon a camp chose for its own checklist item.
 *
 * `ChecklistItemDefinition.icon` is a string the camp team picks, not a member
 * of a platform enum — the whole point of the checklist is that a camp can add
 * "Read the packing list" without an engineer. So this resolves by name and
 * falls back to a neutral tick list for a name it has never seen, because an
 * unknown icon must never be the thing that stops an item rendering.
 */
const ICONS: Readonly<Record<string, LucideIcon>> = {
  "heart-pulse": HeartPulse,
  "file-signature": FileSignature,
  plane: Plane,
  "credit-card": CreditCard,
  backpack: Backpack,
  "shield-check": ShieldCheck,
  "badge-check": BadgeCheck,
  upload: Upload,
};

export function ChecklistIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? ListChecks;
  return <Icon aria-hidden className={cn("size-5", className)} />;
}

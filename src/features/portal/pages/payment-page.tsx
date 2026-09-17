import { Check, CreditCard, HandHeart, Lock } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/features/operations/format";
import { cn } from "@/lib/utils";

import type { ChecklistEntryLocation } from "../checklist-view";
import { FormContextBanner } from "../components/form-context-banner";
import { PortalNotice } from "../components/portal-notice";
import { PortalPageHeader } from "../components/portal-page-header";
import { PortalSection } from "../components/portal-section";

const BASE_FEE_MINOR = 65_000; // $650

/**
 * A discount rule. Only the *first* one that applies wins — that is what
 * "fee precedence" means here: a family that would qualify for two
 * discounts gets the better of the two, not both stacked, and the order
 * below is the order camps agreed to evaluate them in.
 */
interface FeeRule {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly applies: boolean;
  readonly amountMinor: number;
}

const PLAN_OPTIONS = [1, 3, 6] as const;

/**
 * Camp fee, precedence, instalments and an optional subsidy-gap donation.
 *
 * Nothing here is a real charge. The "card" is a labelled placeholder, never
 * a real Stripe Element, because a wireframe should not pretend to collect
 * a real card number — the point being demonstrated is *that* Stripe holds
 * card data, not building a working checkout.
 */
export function PaymentPage({
  location,
  onComplete,
}: {
  location: ChecklistEntryLocation | null;
  onComplete?: (() => void) | undefined;
}) {
  const [financialAid, setFinancialAid] = useState(false);
  const [sibling, setSibling] = useState(false);
  const [plan, setPlan] = useState<(typeof PLAN_OPTIONS)[number]>(1);
  const [donationMinor, setDonationMinor] = useState(0);
  const [paid, setPaid] = useState(false);

  const rules: readonly FeeRule[] = useMemo(
    () => [
      {
        id: "financial_aid",
        label: "Financial aid award",
        detail: "$200 off — approved separately by the camp's aid committee.",
        applies: financialAid,
        amountMinor: BASE_FEE_MINOR - 20_000,
      },
      {
        id: "sibling",
        label: "Sibling discount",
        detail: "10% off when a second household member is also attending.",
        applies: sibling,
        amountMinor: Math.round(BASE_FEE_MINOR * 0.9),
      },
      {
        id: "standard",
        label: "Standard fee",
        detail: "No discount applies.",
        applies: true,
        amountMinor: BASE_FEE_MINOR,
      },
    ],
    [financialAid, sibling],
  );

  const winningRule = rules.find((rule) => rule.applies)!;
  const total = winningRule.amountMinor + donationMinor;
  const instalment = Math.ceil(total / plan);

  if (paid) {
    return (
      <div className="space-y-6">
        <PortalPageHeader title="Payment" backTo="/my/programs" backLabel="My camps" />
        <PortalSection id="done" title="Payment set up">
          <div className="flex items-start gap-3">
            <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              {plan === 1
                ? `A single payment of ${formatCurrency(total)} was simulated.`
                : `A ${plan}-instalment plan of ${formatCurrency(instalment)} each was simulated.`}{" "}
              Nothing was really charged — this is a wireframe.
            </p>
          </div>
        </PortalSection>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Payment" backTo="/my/programs" backLabel="My camps" />
      <FormContextBanner location={location} />

      <PortalSection id="fee" title="Camp fee">
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
            <span>Financial aid approved for this family</span>
            <input
              type="checkbox"
              className="size-4"
              checked={financialAid}
              onChange={(event) => setFinancialAid(event.target.checked)}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
            <span>Another household member is also attending this camp</span>
            <input
              type="checkbox"
              className="size-4"
              checked={sibling}
              onChange={(event) => setSibling(event.target.checked)}
            />
          </label>
        </div>

        <ul className="mt-4 space-y-1.5 text-sm">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className={cn(
                "flex items-center justify-between rounded-md px-2.5 py-1.5",
                rule.id === winningRule.id
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground line-through decoration-muted-foreground/50",
              )}
            >
              <span>
                {rule.label}
                {rule.id !== winningRule.id ? " — superseded" : ""}
              </span>
              <span className="tabular-nums">{formatCurrency(rule.amountMinor)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Rules are checked in this order and only the first that applies is used — discounts are
          never stacked.
        </p>
      </PortalSection>

      <PortalSection id="plan" title="Payment plan">
        <RadioGroup
          value={String(plan)}
          onValueChange={(next) => setPlan(Number(next) as (typeof PLAN_OPTIONS)[number])}
          className="grid grid-cols-3 gap-2"
        >
          {PLAN_OPTIONS.map((option) => (
            <Label
              key={option}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-md border border-border p-3 text-center text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem value={String(option)} className="sr-only" />
              <span className="font-semibold">
                {option === 1 ? "Pay in full" : `${option} instalments`}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatCurrency(Math.ceil((winningRule.amountMinor + donationMinor) / option))}
                {option > 1 ? " ea." : ""}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </PortalSection>

      <PortalSection
        id="donation"
        title="Help close the gap"
        description="Optional — supports financial aid for other families."
      >
        <div className="flex flex-wrap gap-2">
          {[0, 1000, 2500, 5000].map((amountMinor) => (
            <Button
              key={amountMinor}
              type="button"
              size="sm"
              variant={donationMinor === amountMinor ? "default" : "secondary"}
              onClick={() => setDonationMinor(amountMinor)}
            >
              <HandHeart aria-hidden className="size-4" />
              {amountMinor === 0 ? "No thanks" : formatCurrency(amountMinor)}
            </Button>
          ))}
        </div>
      </PortalSection>

      <PortalNotice tone="info" title="Card details never reach Luma">
        <span className="flex items-center gap-1.5">
          <Lock aria-hidden className="size-3.5" />
          Payment is processed by Stripe. Card numbers go straight to Stripe's own secure form —
          Luma only ever sees a payment status, never a card number.
        </span>
      </PortalNotice>

      <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        <CreditCard aria-hidden className="mx-auto size-6" />
        <p className="mt-2">Stripe's card entry would render here in a full build.</p>
      </div>

      <Button
        type="button"
        className="w-full"
        onClick={() => {
          setPaid(true);
          onComplete?.();
        }}
      >
        {plan === 1
          ? `Pay ${formatCurrency(total)}`
          : `Start plan — ${formatCurrency(instalment)} today`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Nothing is really charged. This button only simulates a successful payment.
      </p>
    </div>
  );
}

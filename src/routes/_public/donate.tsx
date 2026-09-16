import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { SiteFooter } from "@/components/landing/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/*
 * CONTENT STATUS -- needs a review pass before launch.
 *
 * There is no approved donate.html mockup. Copy and preset amounts are taken
 * from jmcusa.org/donate; the layout follows the shared design tokens.
 *
 * NO PAYMENT PROCESSING IS WIRED UP. The form validates and shows a
 * confirmation, but no money moves and no card details are collected. Do not
 * ship this page to production as-is -- see the TODO in handleSubmit.
 */

const PRESET_AMOUNTS = [25, 50, 100, 250] as const;

type DonateSearch = {
  /** Attribution for which link the donor arrived from (header/hero/cta/footer). */
  source?: string | undefined;
};

export const Route = createFileRoute("/_public/donate")({
  validateSearch: (search: Record<string, unknown>): DonateSearch => ({
    source: typeof search["source"] === "string" ? search["source"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Donate — Luma by Jubilee Monuments Corp" },
      {
        name: "description",
        content:
          "Support JMC programs. Your donation helps make transformative camp experiences accessible to every young person, regardless of financial circumstances.",
      },
    ],
  }),
  component: Donate,
});

function Donate() {
  const { source } = Route.useSearch();
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // A preset click and the custom field are two views of one value; whichever
  // the donor touched last is the one that counts.
  const selectedAmount = amount ?? (customAmount ? Number(customAmount) : null);
  const amountIsValid = selectedAmount !== null && selectedAmount > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amountIsValid) return;

    const data = Object.fromEntries(new FormData(event.currentTarget));
    // TODO(backend): hand off to the payment processor. Nothing here charges
    // anyone -- this only records intent locally. Attribution `source` should
    // travel with the transaction so link performance stays measurable.
    console.warn("Donation submitted — no payment processor wired up yet.", {
      ...data,
      amount: selectedAmount,
      source: source ?? "direct",
    });
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-2xl px-6 py-12 text-center sm:py-16">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Support JMC Programs</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Your generous donation helps make transformative camp experiences accessible to every
            young person, regardless of financial circumstances.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        {submitted ? (
          <div
            role="status"
            className="rounded-xl border border-border bg-card p-8 text-center shadow-sm"
          >
            <h2 className="text-xl font-bold text-foreground">Thank you!</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your intent to donate ${selectedAmount} has been recorded. Payment processing is not
              yet connected, so no charge has been made.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-foreground">Choose an amount</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PRESET_AMOUNTS.map((preset) => {
                  const isSelected = amount === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "h-11 rounded-md border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      ${preset}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="donate-custom">Or enter a custom amount</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="donate-custom"
                    name="customAmount"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="decimal"
                    placeholder="0"
                    className="pl-7"
                    value={customAmount}
                    onChange={(event) => {
                      setCustomAmount(event.target.value);
                      setAmount(null);
                    }}
                  />
                </div>
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="donate-name">Your Name</Label>
              <Input id="donate-name" name="name" autoComplete="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donate-email">Email Address</Label>
              <Input
                id="donate-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={!amountIsValid}>
              {amountIsValid ? `Donate $${selectedAmount}` : "Donate"}
            </Button>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Jubilee Monuments Corp is a 501(c)(3) nonprofit organization (EIN 52-1395130).
              Donations are tax-deductible to the fullest extent permitted by law.
            </p>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

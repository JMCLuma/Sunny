import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { SiteFooter } from "@/components/landing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatGrade, type Region } from "@/features/operations/domain";
import type { EligibleInstanceRow } from "@/features/operations/data/repository";
import { cn } from "@/lib/utils";

import {
  CAMPS,
  CAMP_INTEREST_LABELS,
  campMonogram,
  type CampInterest,
  type CampProfile,
} from "../camp-catalogue";
import type { CampSearch } from "../camp-search";

/**
 * Find My Camp.
 *
 * Thirty-plus camps is too many to read through, and the BRD asks for
 * filtering by age, location and interest. The harder problem is the one the
 * 09-09 call named: a family in Houston seeing every Mosaic in the country and
 * applying to eight of them. Filtering by eligibility is how that stops.
 *
 * Camps a visitor cannot attend are shown, greyed, with the reason. A camp
 * that silently disappears produces an email asking where it went; one that
 * says "this camp is for rising 7th–9th grade" answers the question on the
 * page. The same rule holds once someone signs in.
 */

export interface FindMyCampPageProps {
  readonly search: CampSearch;
  readonly regions: readonly Region[];
  /** Eligibility per open session, already evaluated against the filters. */
  readonly rows: readonly EligibleInstanceRow[];
  readonly onChange: (next: Partial<CampSearch>) => void;
}

interface CampVerdict {
  readonly camp: CampProfile;
  readonly sessions: readonly EligibleInstanceRow[];
  readonly eligible: boolean;
  readonly reason: string | null;
}

function buildVerdicts(
  rows: readonly EligibleInstanceRow[],
  search: CampSearch,
): readonly CampVerdict[] {
  const asked = search.age !== null || search.grade !== null || search.regionId !== null;

  return CAMPS.filter(
    (camp) => search.interest === null || camp.interests.includes(search.interest),
  ).map((camp) => {
    const sessions = rows.filter((row) => row.programSlug === camp.slug);
    // Nothing asked yet, or no session with stated criteria: show it plainly
    // rather than guessing at a verdict we have no basis for.
    if (!asked || sessions.length === 0) {
      return { camp, sessions, eligible: true, reason: null };
    }

    const match = sessions.find((row) => row.result.verdict === "eligible");
    if (match) return { camp, sessions, eligible: true, reason: null };

    const unknown = sessions.find((row) => row.result.verdict === "unknown");
    const source = unknown ?? sessions[0]!;
    return {
      camp,
      sessions,
      eligible: false,
      reason: source.result.reasons[0]?.detail ?? null,
    };
  });
}

export function FindMyCampPage({ search, regions, rows, onChange }: FindMyCampPageProps) {
  const verdicts = buildVerdicts(rows, search);
  const open = verdicts.filter((verdict) => verdict.eligible);
  const closed = verdicts.filter((verdict) => !verdict.eligible);

  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Find my camp
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Which camp is right for your family?
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tell us a little and we&apos;ll show what&apos;s open. Sign in and we&apos;ll check
          against each child&apos;s actual profile instead.
        </p>

        <div className="mt-8 grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Age" htmlFor="camp-age">
            <Input
              id="camp-age"
              type="number"
              inputMode="numeric"
              min={4}
              max={30}
              placeholder="Any"
              value={search.age ?? ""}
              onChange={(event) =>
                onChange({ age: event.target.value === "" ? null : Number(event.target.value) })
              }
            />
          </Field>

          <Field label="Rising grade" htmlFor="camp-grade">
            <Select
              value={search.grade === null ? "any" : String(search.grade)}
              onValueChange={(value) => onChange({ grade: value === "any" ? null : Number(value) })}
            >
              <SelectTrigger id="camp-grade">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any grade</SelectItem>
                {Array.from({ length: 13 }, (_, grade) => (
                  <SelectItem key={grade} value={String(grade)}>
                    {formatGrade(grade)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Region" htmlFor="camp-region">
            <Select
              value={search.regionId ?? "any"}
              onValueChange={(value) => onChange({ regionId: value === "any" ? null : value })}
            >
              <SelectTrigger id="camp-region">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Anywhere</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Interest" htmlFor="camp-interest">
            <Select
              value={search.interest ?? "any"}
              onValueChange={(value) =>
                onChange({ interest: value === "any" ? null : (value as CampInterest) })
              }
            >
              <SelectTrigger id="camp-interest">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Anything</SelectItem>
                {Object.entries(CAMP_INTEREST_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          <Search aria-hidden className="me-1.5 inline size-4" />
          {open.length} {open.length === 1 ? "camp" : "camps"} open to you
          {closed.length > 0 ? `, ${closed.length} not a match` : ""}.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {open.map((verdict) => (
            <CampCard key={verdict.camp.slug} verdict={verdict} />
          ))}
        </div>

        {closed.length > 0 ? (
          <>
            <h2 className="mt-12 text-lg font-semibold">Not a match right now</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Shown so you can see why, and what your child would need to grow into.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {closed.map((verdict) => (
                <CampCard key={verdict.camp.slug} verdict={verdict} />
              ))}
            </div>
          </>
        ) : null}
      </section>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function CampCard({ verdict }: { verdict: CampVerdict }) {
  const { camp, sessions, eligible, reason } = verdict;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors",
        eligible ? "hover:border-foreground/20" : "opacity-70",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl",
            camp.logo ? "border border-border bg-white" : "border border-primary/20 bg-primary/10",
          )}
        >
          {camp.logo ? (
            <img src={camp.logo} alt="" aria-hidden className="size-full object-contain p-1.5" />
          ) : (
            <span className="text-sm font-bold text-primary">{campMonogram(camp.name)}</span>
          )}
        </div>
        {camp.ageLabel ? <Badge variant="outline">{camp.ageLabel}</Badge> : null}
      </div>

      <h3 className="text-lg font-bold tracking-tight">{camp.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {camp.description}
      </p>

      {reason ? (
        <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{reason}</p>
      ) : null}

      {sessions.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"} taking applications
        </p>
      ) : null}

      <Button asChild variant={eligible ? "default" : "outline"} className="mt-4 w-full">
        <Link to="/camps/$slug" params={{ slug: camp.slug }}>
          {eligible ? "See dates & apply" : "See details"}
        </Link>
      </Button>
    </article>
  );
}

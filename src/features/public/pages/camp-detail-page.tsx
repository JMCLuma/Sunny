import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { SiteFooter } from "@/components/landing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/operations/components/status-badge";
import { describeCriteria } from "@/features/operations/domain";
import type { EligibleInstanceRow } from "@/features/operations/data/repository";

import { campMonogram, type CampProfile } from "../camp-catalogue";
import { DEFAULT_CAMP_SEARCH } from "../camp-search";
import { CAMP_INTEREST_LABELS } from "../camp-catalogue";

/**
 * One camp, publicly.
 *
 * Eligibility is stated in words rather than implied by an age badge, because
 * the badge cannot express what the criteria actually allow. "Ages 15–17 or
 * rising 10th–12th grade" is two rules, and a family reading "Ages 15–17"
 * alone would wrongly rule themselves out.
 */

export interface CampDetailPageProps {
  readonly camp: CampProfile;
  readonly sessions: readonly EligibleInstanceRow[];
}

export function CampDetailPage({ camp, sessions }: CampDetailPageProps) {
  const openSessions = sessions.filter(
    (session) => session.instance.status === "applications_open",
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <Link
          to="/camps"
          search={DEFAULT_CAMP_SEARCH}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All camps
        </Link>

        <header className="mt-6 flex flex-wrap items-start gap-5">
          <div
            className={
              camp.logo
                ? "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white"
                : "flex size-20 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
            }
          >
            {camp.logo ? (
              <img src={camp.logo} alt="" aria-hidden className="size-full object-contain p-2" />
            ) : (
              <span className="text-xl font-bold text-primary">{campMonogram(camp.name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{camp.name}</h1>
            <p className="mt-2 text-muted-foreground">{camp.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {camp.ageLabel ? <Badge variant="secondary">{camp.ageLabel}</Badge> : null}
              {camp.residential ? <Badge variant="outline">Residential</Badge> : null}
              {camp.interests.map((interest) => (
                <Badge key={interest} variant="outline">
                  {CAMP_INTEREST_LABELS[interest]}
                </Badge>
              ))}
            </div>
          </div>
        </header>

        <h2 className="mt-12 text-xl font-semibold">Sessions</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-muted-foreground">
            No sessions are taking applications at the moment. Create an account and we&apos;ll let
            you know when they open.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {sessions.map((session) => (
              <li key={session.instance.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-semibold">{session.instance.name}</h3>
                  <StatusBadge status={session.instance.status} />
                </div>

                <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays aria-hidden className="size-4 shrink-0" />
                    <span>
                      {session.instance.startDate
                        ? `${session.instance.startDate} – ${session.instance.endDate ?? "TBC"}`
                        : "Dates to be confirmed"}
                      {session.instance.datesConfirmed ? "" : " (provisional)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin aria-hidden className="size-4 shrink-0" />
                    <span>{session.instance.locationName ?? "Location to be confirmed"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users aria-hidden className="size-4 shrink-0" />
                    <span>{session.region?.name ?? "National"}</span>
                  </div>
                </dl>

                {session.criteria ? (
                  <p className="mt-3 text-sm">
                    <span className="font-medium">Who can apply: </span>
                    <span className="text-muted-foreground">
                      {describeCriteria(session.criteria)}
                      {session.criteria.firstTimeOnly ? ", first-time attendees only" : ""}
                    </span>
                  </p>
                ) : null}

                {session.deadline ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Applications close {session.deadline}.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-6">
          <h2 className="text-lg font-semibold">Ready to apply?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create one account for your household. Add each child once, and we&apos;ll show only the
            camps they&apos;re eligible for — here and every year after.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/signup">Create an account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/my/apply">I already have one</Link>
            </Button>
          </div>
          {openSessions.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Nothing is open for this camp today — an account means we can tell you when it is.
            </p>
          ) : null}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

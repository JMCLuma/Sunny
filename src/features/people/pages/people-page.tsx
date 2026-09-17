import { AlertTriangle, Link2, ShieldQuestion, UserRound } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/features/operations/components";
import type { MatchReviewRow, PersonDirectoryRow } from "@/features/operations/data/repository";
import type { MatchEvidence, MatchOutcome } from "@/features/operations/domain";

/**
 * One record per person, and the queue of records we are not sure about.
 *
 * The directory is the easy half. The queue is the point: merging two live
 * systems means the same person exists twice under different spellings, and
 * the only safe way through is a human deciding the ambiguous cases.
 *
 * The rule the whole screen turns on: **matching may link, but it may never
 * reveal**. A resolver sees the candidate record because that is their job.
 * The person who triggered the match never does — they are told their profile
 * is under review and nothing else. Getting that backwards exposes one
 * family's history to another family who happens to share a name.
 */

const EVIDENCE_STRENGTH: Readonly<Record<MatchEvidence, { label: string; strong: boolean }>> = {
  invitation_token: { label: "Invitation token", strong: true },
  external_id: { label: "External registration ID", strong: true },
  verified_email: { label: "Verified email", strong: true },
  email_and_phone: { label: "Email and phone", strong: false },
  name_and_dob: { label: "Name and date of birth", strong: false },
  name_only: { label: "Name only", strong: false },
};

const OUTCOME_COPY: Readonly<Record<MatchOutcome, { label: string; detail: string }>> = {
  confirmed: {
    label: "Confirmed",
    detail: "Unambiguous evidence. Linked without anyone having to decide.",
  },
  no_match: { label: "No match", detail: "A new person was created." },
  uncertain: {
    label: "Uncertain",
    detail: "Plausible but not conclusive. The applicant has been shown nothing.",
  },
  conflict: {
    label: "Conflict",
    detail: "Evidence points both ways. Held until someone decides.",
  },
};

export interface PeoplePageProps {
  readonly directory: readonly PersonDirectoryRow[];
  readonly reviews: readonly MatchReviewRow[];
  readonly canResolve: boolean;
  readonly onResolve: (reviewId: string, decision: "link" | "reject") => void;
}

export function PeoplePage({ directory, reviews, canResolve, onResolve }: PeoplePageProps) {
  const [search, setSearch] = useState("");
  const open = reviews.filter((row) => row.review.status === "open");

  const filtered = search.trim()
    ? directory.filter((row) =>
        row.person.displayName.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : directory;

  return (
    <Tabs defaultValue="directory" className="space-y-6">
      <TabsList>
        <TabsTrigger value="directory">
          <UserRound aria-hidden className="size-4" />
          Directory
        </TabsTrigger>
        <TabsTrigger value="reviews">
          <ShieldQuestion aria-hidden className="size-4" />
          Match review
          {open.length > 0 ? (
            <Badge variant="destructive" className="ms-1">
              {open.length}
            </Badge>
          ) : null}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="directory" className="space-y-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          One record per person, however many camps, roles or years they appear in. A participant
          who returns as a volunteer is the same record, not a second one.
        </p>

        <div className="max-w-sm space-y-1.5">
          <Label htmlFor="people-search">Search</Label>
          <Input
            id="people-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-end">Applications</TableHead>
                <TableHead className="text-end">Open reviews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.person.id}>
                  <TableCell className="font-medium">{row.person.displayName}</TableCell>
                  <TableCell>
                    {row.accountStatus ? (
                      <Badge variant="outline">{row.accountStatus.replace(/_/g, " ")}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No login</span>
                    )}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">{row.programCount}</TableCell>
                  <TableCell className="text-end tabular-nums">
                    {row.openMatchReviews > 0 ? (
                      <Badge variant="destructive">{row.openMatchReviews}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 ? <EmptyState message="Nobody matches that search." /> : null}
      </TabsContent>

      <TabsContent value="reviews" className="space-y-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Possible duplicates held for a person to decide. The applicant has not been told who they
          might be — matching may link a record, but it must never reveal one.
        </p>

        {reviews.length === 0 ? (
          <EmptyState message="Nothing waiting." />
        ) : (
          <ul className="space-y-4">
            {reviews.map((row) => (
              <MatchReviewCard
                key={row.review.id}
                row={row}
                canResolve={canResolve}
                onResolve={onResolve}
              />
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}

function MatchReviewCard({
  row,
  canResolve,
  onResolve,
}: {
  row: MatchReviewRow;
  canResolve: boolean;
  onResolve: (reviewId: string, decision: "link" | "reject") => void;
}) {
  const { review } = row;
  const outcome = OUTCOME_COPY[review.outcome];
  const isOpen = review.status === "open";

  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{row.profileName}</h3>
          <p className="text-sm text-muted-foreground">{row.accountEmail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={review.outcome === "conflict" ? "destructive" : "secondary"}>
            {outcome.label}
          </Badge>
          {!isOpen ? <Badge variant="outline">{review.status}</Badge> : null}
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{outcome.detail}</p>

      <div className="mt-4 rounded-lg bg-muted/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Possible existing record
        </p>
        <p className="mt-1 font-medium">{review.candidateLabel}</p>
        {review.note ? <p className="mt-1 text-sm text-muted-foreground">{review.note}</p> : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {review.evidence.map((evidence) => {
            const meta = EVIDENCE_STRENGTH[evidence];
            return (
              <Badge key={evidence} variant={meta.strong ? "default" : "outline"}>
                {meta.strong ? (
                  <Link2 aria-hidden className="size-3" />
                ) : (
                  <AlertTriangle aria-hidden className="size-3" />
                )}
                {meta.label}
              </Badge>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {review.evidence.some((evidence) => EVIDENCE_STRENGTH[evidence].strong)
            ? "Strong evidence: an identifier only the right person could hold."
            : "Weak evidence only. Name and date of birth suggest a record; they never merge one."}
        </p>
      </div>

      {isOpen ? (
        canResolve ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => onResolve(review.id, "link")}>Link to this record</Button>
            <Button variant="outline" onClick={() => onResolve(review.id, "reject")}>
              Keep separate
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            You can see this queue but not resolve it. Resolving a match needs People management.
          </p>
        )
      ) : null}
    </li>
  );
}

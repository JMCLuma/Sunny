import { useEffect, useState } from "react";
import { Bot, CheckCircle2 } from "lucide-react";

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, OperationsSection } from "@/features/operations/components";
import { StatusBadge } from "@/features/operations/components/status-badge";
import type { ApplicationQueueRow } from "@/features/operations/data";
import type { CriterionScore, Id, ScoringRubric } from "@/features/operations/domain";
import { BlindModeSwitch } from "../components/blind-mode-switch";
import { clampPoints, confirmationState, maxWeightedTotal, weightedTotal } from "../view-models";
import type { ReviewSearch } from "../application-filters";

export interface ReviewInstanceOption {
  readonly id: string;
  readonly name: string;
}

/** The submission currently open in the scoring panel, with a fresh draft. */
export interface ReviewPanel {
  readonly row: ApplicationQueueRow;
  readonly draftScores: readonly CriterionScore[];
}

/**
 * Blind review and scoring.
 *
 * Two ideas the module README doesn't let this screen soften: blind mode has
 * to be the loudest thing on the page (`BlindModeSwitch` does that job), and
 * an essay criterion the AI pass proposed is not a score until a person
 * confirms it — `confirmationState` is what the submit button is gated on,
 * not a courtesy label next to it.
 */
export function ReviewPage({
  instances,
  selectedInstanceId,
  rubric,
  rows,
  identified,
  canScore,
  panel,
  search,
  onSearchChange,
  onScoreSubmit,
}: {
  instances: readonly ReviewInstanceOption[];
  selectedInstanceId: string | null;
  rubric: ScoringRubric | null;
  rows: readonly ApplicationQueueRow[];
  identified: boolean;
  canScore: boolean;
  panel: ReviewPanel | null;
  search: ReviewSearch;
  onSearchChange: (next: ReviewSearch) => void;
  onScoreSubmit: (
    submissionId: Id,
    rubricId: Id,
    scores: readonly CriterionScore[],
  ) => Promise<void>;
}) {
  function closePanel() {
    const { submission: _submission, ...rest } = search;
    onSearchChange(rest);
  }

  return (
    <div className="space-y-6">
      <BlindModeSwitch
        identified={identified}
        onChange={(next) => onSearchChange({ ...search, ...(next ? { identified: true } : {}) })}
        {...(canScore
          ? {}
          : { note: "Your role can score here, but only for the sessions your access reaches." })}
      />

      {instances.length > 1 ? (
        <div className="max-w-xs">
          <Label htmlFor="review-instance">Session</Label>
          <Select
            value={selectedInstanceId ?? instances[0]!.id}
            onValueChange={(value) => onSearchChange({ ...search, instance: value })}
          >
            <SelectTrigger id="review-instance" className="mt-1">
              <SelectValue placeholder="Choose a session" />
            </SelectTrigger>
            <SelectContent>
              {instances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  {instance.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <OperationsSection
        id="review-queue"
        title="Applications to score"
        {...(rubric ? { description: `Scored against ${rubric.name}, v${rubric.version}.` } : {})}
      >
        {rows.length === 0 ? (
          <EmptyState message="No applications in this session are within your access." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Applicant</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Score</TableHead>
                  <TableHead scope="col">Reviewers</TableHead>
                  <TableHead scope="col" className="text-end">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.submission.id}>
                    <TableCell className="font-medium">{row.applicantLabel}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.submission.status} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.totalScore === null ? (
                        <span className="text-muted-foreground">Not scored</span>
                      ) : (
                        row.totalScore
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {row.scoredBy}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        type="button"
                        size="sm"
                        variant={row.totalScore === null ? "default" : "outline"}
                        disabled={!rubric}
                        onClick={() => onSearchChange({ ...search, submission: row.submission.id })}
                      >
                        {row.totalScore === null ? "Score" : "Review score"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </OperationsSection>

      <Sheet open={panel !== null} onOpenChange={(open) => !open && closePanel()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg" side="right">
          {panel && rubric ? (
            <ScoringPanel
              panel={panel}
              rubric={rubric}
              readOnly={!canScore}
              onSubmit={async (scores) => {
                await onScoreSubmit(panel.row.submission.id, rubric.id, scores);
                closePanel();
              }}
              onCancel={closePanel}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ScoringPanel({
  panel,
  rubric,
  readOnly,
  onSubmit,
  onCancel,
}: {
  panel: ReviewPanel;
  rubric: ScoringRubric;
  readOnly: boolean;
  onSubmit: (scores: readonly CriterionScore[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [scores, setScores] = useState<readonly CriterionScore[]>(panel.draftScores);
  const [saving, setSaving] = useState(false);

  // A different submission opened in the same sheet instance needs a fresh
  // draft — without this, editing one applicant's essay score would bleed
  // into whichever applicant's panel opens next.
  useEffect(() => {
    setScores(panel.draftScores);
  }, [panel.row.submission.id, panel.draftScores]);

  const confirmation = confirmationState(scores);
  const total = weightedTotal(scores, rubric);
  const max = maxWeightedTotal(rubric);
  const canSubmit = !readOnly && confirmation.signedOff && !saving;

  function updateScore(criterionId: Id, patch: Partial<CriterionScore>) {
    setScores((current) =>
      current.map((entry) =>
        entry.criterionId === criterionId ? { ...entry, ...patch, aiSuggested: false } : entry,
      ),
    );
  }

  function confirmAsIs(criterionId: Id) {
    setScores((current) =>
      current.map((entry) =>
        entry.criterionId === criterionId ? { ...entry, aiSuggested: false } : entry,
      ),
    );
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{panel.row.applicantLabel}</SheetTitle>
        <SheetDescription>
          {rubric.name} · v{rubric.version} — {total} of {max} points so far
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        {rubric.criteria.map((criterion) => {
          const entry = scores.find((score) => score.criterionId === criterion.id);
          if (!entry) return null;
          const awaitingHuman = entry.aiSuggested;

          return (
            <div
              key={criterion.id}
              className={
                awaitingHuman
                  ? "rounded-lg border border-highlight bg-highlight/15 p-3"
                  : "rounded-lg border border-border p-3"
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{criterion.label}</p>
                  {criterion.description ? (
                    <p className="text-xs text-muted-foreground">{criterion.description}</p>
                  ) : null}
                </div>
                {awaitingHuman ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-highlight bg-highlight/25 text-highlight-foreground"
                  >
                    <Bot className="size-3" aria-hidden="true" />
                    AI-suggested — unconfirmed
                  </Badge>
                ) : null}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={criterion.maxPoints}
                  value={entry.points}
                  disabled={readOnly}
                  aria-label={`${criterion.label} points, out of ${criterion.maxPoints}`}
                  onChange={(event) =>
                    updateScore(criterion.id, {
                      points: clampPoints(Number(event.target.value), criterion.maxPoints),
                    })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  of {criterion.maxPoints} · weight ×{criterion.weight}
                </span>
              </div>

              {awaitingHuman && !readOnly ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => confirmAsIs(criterion.id)}
                >
                  <CheckCircle2 className="me-1.5 size-3.5" aria-hidden="true" />
                  Confirm this score
                </Button>
              ) : null}

              <Textarea
                className="mt-2"
                placeholder="Note (optional)"
                value={entry.note ?? ""}
                disabled={readOnly}
                onChange={(event) =>
                  updateScore(criterion.id, { note: event.target.value || null })
                }
              />
            </div>
          );
        })}
      </div>

      {!readOnly && !confirmation.signedOff ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {confirmation.awaitingHuman.length} of {confirmation.total} criteria still carry an
          unconfirmed AI suggestion. Confirm or adjust each one before submitting — nothing here is
          decided by a machine without a person signing for it.
        </p>
      ) : null}

      <SheetFooter className="mt-6">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={async () => {
            setSaving(true);
            try {
              await onSubmit(scores);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving…" : "Submit score"}
        </Button>
      </SheetFooter>
    </>
  );
}

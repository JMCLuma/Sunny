import { Plus, Trash2 } from "lucide-react";

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
import type { AnswerRow, ApplicationQuestion } from "@/features/operations/domain";

import { canAddEntry } from "../wizard/answers";

/**
 * A repeating group, with its cap on show.
 *
 * `maxEntries` is in the data because the draft form had "camps attended" as
 * an unbounded list, and an unbounded list is a support problem waiting to
 * happen. A cap the applicant cannot see is just a button that stops working,
 * so the count is stated up front and the button explains itself when it goes.
 */
export function RepeatableGroupField({
  question,
  rows,
  idPrefix,
  onChange,
}: {
  question: ApplicationQuestion;
  rows: readonly AnswerRow[];
  idPrefix: string;
  onChange: (rows: readonly AnswerRow[]) => void;
}) {
  const subQuestions = [...(question.subQuestions ?? [])].sort((a, b) => a.order - b.order);
  const cap = question.maxEntries;
  const canAdd = canAddEntry(question, rows);

  function updateCell(index: number, subQuestionId: string, value: string | number | null) {
    onChange(
      rows.map((row, position) => (position === index ? { ...row, [subQuestionId]: value } : row)),
    );
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          Nothing added yet.
        </p>
      ) : null}

      {rows.map((row, index) => (
        <div key={index} className="rounded-md border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Entry {index + 1}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(rows.filter((_, position) => position !== index))}
            >
              <Trash2 aria-hidden className="size-4" />
              <span className="sr-only sm:not-sr-only sm:ms-1">Remove</span>
            </Button>
          </div>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {subQuestions.map((sub) => {
              const fieldId = `${idPrefix}-${index}-${sub.id}`;
              const cell = row[sub.id];

              return (
                <div key={sub.id}>
                  <Label htmlFor={fieldId} className="text-xs">
                    {sub.label}
                    {sub.required ? <span className="ms-1 text-destructive">*</span> : null}
                  </Label>
                  {sub.options ? (
                    <Select
                      value={typeof cell === "string" ? cell : ""}
                      onValueChange={(next) => updateCell(index, sub.id, next)}
                    >
                      <SelectTrigger id={fieldId} className="mt-1">
                        <SelectValue placeholder="Choose one" />
                      </SelectTrigger>
                      <SelectContent>
                        {sub.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={fieldId}
                      className="mt-1"
                      type={sub.type === "number" ? "number" : "text"}
                      inputMode={sub.type === "number" ? "numeric" : undefined}
                      value={cell === null || cell === undefined ? "" : String(cell)}
                      onChange={(event) =>
                        updateCell(
                          index,
                          sub.id,
                          sub.type === "number"
                            ? event.target.value === ""
                              ? null
                              : Number(event.target.value)
                            : event.target.value,
                        )
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canAdd}
          onClick={() => onChange([...rows, {}])}
        >
          <Plus aria-hidden className="size-4" />
          Add another
        </Button>
        {cap ? (
          <p className="text-xs text-muted-foreground">
            {canAdd
              ? `${rows.length} of ${cap} — you can add up to ${cap}.`
              : `That's the maximum of ${cap}. Remove one to add another.`}
          </p>
        ) : null}
      </div>
    </div>
  );
}

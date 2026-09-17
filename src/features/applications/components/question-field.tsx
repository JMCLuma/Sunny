import { Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerRow, ApplicationQuestion } from "@/features/operations/domain";

import { rowsOf, type AnswerValue } from "../wizard/answers";
import { RepeatableGroupField } from "./repeatable-group-field";
import { TypeaheadField } from "./typeahead-field";

/**
 * One question, whatever kind it is.
 *
 * Every question type in the domain renders from here, so a camp adding an
 * essay or a capped repeatable to its own section gets a working field without
 * anyone touching a screen. That is the promise the form engine makes: camp
 * questions are data, not a fork of the application.
 */
export function QuestionField({
  question,
  value,
  fileName,
  invalid,
  idPrefix = "q",
  onChange,
}: {
  question: ApplicationQuestion;
  value: AnswerValue | undefined;
  fileName?: string | undefined;
  invalid?: boolean | undefined;
  idPrefix?: string;
  onChange: (value: AnswerValue, fileName?: string) => void;
}) {
  const fieldId = `${idPrefix}-${question.id}`;
  const helpId = question.helpText ? `${fieldId}-help` : undefined;
  const errorId = invalid ? `${fieldId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="text-sm">
        {question.label}
        {question.required ? (
          <span className="ms-1 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
        {question.required ? <span className="sr-only">(required)</span> : null}
      </Label>

      {question.helpText ? (
        <p id={helpId} className="text-xs text-muted-foreground">
          {question.helpText}
        </p>
      ) : null}

      <Control
        question={question}
        fieldId={fieldId}
        describedBy={describedBy}
        invalid={invalid}
        value={value}
        fileName={fileName}
        onChange={onChange}
      />

      {invalid ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          This one is needed before you can go on.
        </p>
      ) : null}
    </div>
  );
}

function Control({
  question,
  fieldId,
  describedBy,
  invalid,
  value,
  fileName,
  onChange,
}: {
  question: ApplicationQuestion;
  fieldId: string;
  describedBy?: string | undefined;
  invalid?: boolean | undefined;
  value: AnswerValue | undefined;
  fileName?: string | undefined;
  onChange: (value: AnswerValue, fileName?: string) => void;
}) {
  const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const chosen = Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

  switch (question.type) {
    case "long_text":
      return (
        <div>
          <Textarea
            id={fieldId}
            rows={5}
            value={text}
            maxLength={question.maxLength}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
          />
          {question.maxLength ? (
            <p className="mt-1 text-end text-xs tabular-nums text-muted-foreground">
              {text.length} / {question.maxLength}
            </p>
          ) : null}
        </div>
      );

    case "select":
      return (
        <Select value={text} onValueChange={(next) => onChange(next)}>
          <SelectTrigger id={fieldId} aria-invalid={invalid} aria-describedby={describedBy}>
            <SelectValue placeholder="Choose one" />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "typeahead":
      return (
        <TypeaheadField
          id={fieldId}
          options={question.options ?? []}
          value={typeof value === "string" ? value : null}
          placeholder="Start typing to search"
          emptyMessage="Nothing matches that. Try fewer letters."
          describedBy={describedBy}
          invalid={invalid}
          onChange={(next) => onChange(next)}
        />
      );

    case "multi_select":
      return (
        <div role="group" aria-describedby={describedBy} className="grid gap-2 sm:grid-cols-2">
          {(question.options ?? []).map((option) => {
            const optionId = `${fieldId}-${option.value}`;
            const checked = chosen.includes(option.value);
            return (
              <div key={option.value} className="flex items-center gap-2">
                <Checkbox
                  id={optionId}
                  checked={checked}
                  onCheckedChange={(next) =>
                    onChange(
                      next === true
                        ? [...chosen, option.value]
                        : chosen.filter((entry) => entry !== option.value),
                    )
                  }
                />
                <Label htmlFor={optionId} className="text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
      );

    case "boolean":
      return (
        <RadioGroup
          id={fieldId}
          aria-describedby={describedBy}
          className="flex gap-4"
          value={value === true ? "true" : value === false ? "false" : ""}
          onValueChange={(next) => onChange(next === "true")}
        >
          {[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ].map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem id={`${fieldId}-${option.value}`} value={option.value} />
              <Label htmlFor={`${fieldId}-${option.value}`} className="text-sm font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case "repeatable_group":
      return (
        <RepeatableGroupField
          question={question}
          rows={rowsOf(value)}
          idPrefix={fieldId}
          onChange={(rows: readonly AnswerRow[]) => onChange(rows)}
        />
      );

    case "file_upload":
      return (
        <FileControl
          fieldId={fieldId}
          question={question}
          fileName={fileName ?? (typeof value === "string" ? value : undefined)}
          describedBy={describedBy}
          invalid={invalid}
          onChange={onChange}
        />
      );

    case "number":
      return (
        <Input
          id={fieldId}
          type="number"
          inputMode="numeric"
          value={text}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) =>
            onChange(event.target.value === "" ? null : Number(event.target.value))
          }
        />
      );

    default:
      return (
        <Input
          id={fieldId}
          type={
            question.type === "email"
              ? "email"
              : question.type === "phone"
                ? "tel"
                : question.type === "date"
                  ? "date"
                  : "text"
          }
          value={text}
          maxLength={question.maxLength}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

/**
 * Upload, mocked.
 *
 * The file name is taken from the picker and nothing leaves the browser: this
 * wireframe has no storage behind it, and a demo that appears to accept a
 * resume it silently drops is worse than one that says what it is doing.
 */
function FileControl({
  fieldId,
  question,
  fileName,
  describedBy,
  invalid,
  onChange,
}: {
  fieldId: string;
  question: ApplicationQuestion;
  fileName?: string | undefined;
  describedBy?: string | undefined;
  invalid?: boolean | undefined;
  onChange: (value: AnswerValue, fileName?: string) => void;
}) {
  const accept = question.acceptedFileTypes?.join(",");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="secondary" size="sm">
          <label htmlFor={fieldId} className="cursor-pointer">
            <Paperclip aria-hidden className="size-4" />
            {fileName ? "Choose a different file" : "Choose a file"}
          </label>
        </Button>
        <input
          id={fieldId}
          type="file"
          className="sr-only"
          accept={accept}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            if (chosen) onChange(chosen.name, chosen.name);
          }}
        />
        {fileName ? (
          <span className="truncate text-sm font-medium">{fileName}</span>
        ) : (
          <span className="text-sm text-muted-foreground">
            {accept ? `${accept} accepted` : "No file chosen"}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Wireframe: the file name is kept, the file itself is not uploaded anywhere.
      </p>
    </div>
  );
}

import type { FormEvent, ReactNode } from "react";

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
import { ANY_OPTION } from "../../program-filters";

export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Filter controls for the Programs screens.
 *
 * The text box is uncontrolled and keyed on the current query, so browser
 * navigation resets it without a synchronising effect; it commits on submit
 * rather than on every keystroke, which keeps one history entry per search.
 * Selects commit immediately, since a single click is already a decision.
 */
export function FilterBar({
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearch,
  onReset,
  isFiltered,
  resultSummary,
  children,
}: {
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearch: (value: string) => void;
  onReset: () => void;
  isFiltered: boolean;
  resultSummary: string;
  children?: ReactNode;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    onSearch(typeof value === "string" ? value : "");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card p-4"
      role="search"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <Label htmlFor="operations-filter-search">{searchLabel}</Label>
          <Input
            id="operations-filter-search"
            name="q"
            type="search"
            key={searchValue}
            defaultValue={searchValue}
            placeholder={searchPlaceholder}
            className="mt-1"
          />
        </div>
        {children}
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {isFiltered ? (
            <Button type="button" variant="ghost" onClick={onReset}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {resultSummary}
      </p>
    </form>
  );
}

export function FilterSelect({
  id,
  label,
  value,
  anyLabel,
  options,
  onChange,
}: {
  id: string;
  label: string;
  /** The sentinel `ANY_OPTION` when no filter is applied. */
  value: string;
  anyLabel: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-40">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="mt-1">
          <SelectValue placeholder={anyLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY_OPTION}>{anyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

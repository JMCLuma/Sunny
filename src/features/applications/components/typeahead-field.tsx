import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { QuestionOption } from "@/features/operations/domain";
import { cn } from "@/lib/utils";

/**
 * A searchable single-select.
 *
 * There are about eighty-five Jamatkhanas in the US, and the same shape of
 * list again for countries and languages. The call was blunt about it: that is
 * not a dropdown. Typing three letters beats scrolling a list nobody can
 * scan — particularly on the phone most of these forms are filled in on.
 *
 * Grouped where the data groups it, so "Southwest" reads as a heading rather
 * than as a prefix repeated down the column.
 */
export function TypeaheadField({
  id,
  options,
  value,
  placeholder,
  emptyMessage,
  describedBy,
  invalid,
  onChange,
}: {
  id: string;
  options: readonly QuestionOption[];
  value: string | null;
  placeholder: string;
  emptyMessage: string;
  describedBy?: string | undefined;
  invalid?: boolean | undefined;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? null;

  const groups = new Map<string, QuestionOption[]>();
  for (const option of options) {
    const key = option.group ?? "";
    const bucket = groups.get(key);
    if (bucket) bucket.push(option);
    else groups.set(key, [option]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            invalid && "border-destructive",
          )}
        >
          <span className="truncate text-start">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown aria-hidden className="ms-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* Matches the trigger width so a long option list cannot spill off a 360px screen. */}
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {[...groups.entries()].map(([group, groupOptions]) => (
              <CommandGroup key={group} heading={group || undefined}>
                {groupOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      aria-hidden
                      className={cn(
                        "me-2 size-4",
                        option.value === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

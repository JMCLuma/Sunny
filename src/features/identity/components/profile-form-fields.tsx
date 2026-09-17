import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfileDraft } from "@/features/operations/data";
import { cn } from "@/lib/utils";

import { GRADES, LANGUAGES, gradeLabel, toggleLanguage } from "../profile-draft";

/**
 * The profile form's fields, with no `<form>`, submit button or heading of
 * its own — both onboarding's "add your first profile" step and the
 * household screen's "add a member" dialog need exactly this set, wrapped in
 * their own chrome. Splitting it here is what keeps the two from drifting
 * apart the first time someone edits only one.
 */
export function ProfileFormFields({
  draft,
  onChange,
  idPrefix,
}: {
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-first`}>Legal first name</Label>
          <Input
            id={`${idPrefix}-first`}
            className="mt-1"
            value={draft.legalFirstName}
            onChange={(event) => onChange({ ...draft, legalFirstName: event.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-last`}>Legal last name</Label>
          <Input
            id={`${idPrefix}-last`}
            className="mt-1"
            value={draft.legalLastName}
            onChange={(event) => onChange({ ...draft, legalLastName: event.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-preferred`}>Preferred name (optional)</Label>
        <Input
          id={`${idPrefix}-preferred`}
          className="mt-1"
          value={draft.preferredName ?? ""}
          onChange={(event) => onChange({ ...draft, preferredName: event.target.value || null })}
        />
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-dob`}>Date of birth</Label>
        <Input
          id={`${idPrefix}-dob`}
          type="date"
          className="mt-1"
          value={draft.dateOfBirth ?? ""}
          onChange={(event) => onChange({ ...draft, dateOfBirth: event.target.value || null })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-secular-grade`}>Rising school grade</Label>
          <Select
            {...(draft.risingSecularGrade !== null
              ? { value: String(draft.risingSecularGrade) }
              : {})}
            onValueChange={(next) => onChange({ ...draft, risingSecularGrade: Number(next) })}
          >
            <SelectTrigger id={`${idPrefix}-secular-grade`} className="mt-1">
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((grade) => (
                <SelectItem key={grade} value={String(grade)}>
                  {gradeLabel(grade)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-rec-grade`}>Rising REC grade</Label>
          <Select
            {...(draft.risingRecGrade !== null ? { value: String(draft.risingRecGrade) } : {})}
            onValueChange={(next) => onChange({ ...draft, risingRecGrade: Number(next) })}
          >
            <SelectTrigger id={`${idPrefix}-rec-grade`} className="mt-1">
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((grade) => (
                <SelectItem key={grade} value={String(grade)}>
                  {gradeLabel(grade)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-languages`}>Languages spoken</Label>
        <div id={`${idPrefix}-languages`} className="mt-1 flex flex-wrap gap-2">
          {LANGUAGES.map((language) => {
            const checked = draft.languages.some((entry) => entry.language === language);
            return (
              <button
                type="button"
                key={language}
                onClick={() =>
                  onChange({ ...draft, languages: toggleLanguage(draft.languages, language) })
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
                aria-pressed={checked}
              >
                {language}
              </button>
            );
          })}
        </div>
      </div>

      <Label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={draft.needsTranslator}
          onCheckedChange={(checked) => onChange({ ...draft, needsTranslator: checked === true })}
        />
        Needs translation support
      </Label>
    </div>
  );
}

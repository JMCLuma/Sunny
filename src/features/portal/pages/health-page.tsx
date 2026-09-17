import { Check, ChevronLeft, ChevronRight, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ChecklistEntryLocation } from "../checklist-view";
import { FormContextBanner } from "../components/form-context-banner";
import { PortalNotice } from "../components/portal-notice";
import { PortalPageHeader } from "../components/portal-page-header";
import { PortalSection } from "../components/portal-section";

const COMMON_CONDITIONS = [
  "Asthma",
  "Severe allergies (food, insect or medication)",
  "Diabetes",
  "Seizure disorder",
  "ADHD",
  "Anxiety or depression",
] as const;

const IMMUNIZATIONS = ["MMR", "Tdap", "Varicella", "Meningococcal", "Polio"] as const;

interface HealthDraft {
  readonly conditions: readonly string[];
  readonly allergies: string;
  readonly medications: string;
  readonly physicianFileName: string | null;
  readonly immunizationsConfirmed: readonly string[];
  readonly insuranceProvider: string;
  readonly insuranceMemberId: string;
  readonly addressLine1: string;
  readonly addressLine2: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly hipaaAcknowledged: boolean;
}

function emptyDraft(): HealthDraft {
  return {
    conditions: [],
    allergies: "",
    medications: "",
    physicianFileName: null,
    immunizationsConfirmed: [],
    insuranceProvider: "",
    insuranceMemberId: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    hipaaAcknowledged: false,
  };
}

const STEP_COUNT = 4;

/**
 * The health questionnaire.
 *
 * Four steps: history, physician sign-off, insurance and the full street
 * address the application deliberately never asked for, then a HIPAA
 * consent. Nothing here writes to a repository — Health has none in this
 * wireframe — so the form is honest local state, and submitting only marks
 * the linked checklist item done when there is one to mark.
 */
export function HealthPage({
  location,
  onComplete,
}: {
  location: ChecklistEntryLocation | null;
  onComplete?: (() => void) | undefined;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<HealthDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);

  function toggle(list: readonly string[], value: string): readonly string[] {
    return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <PortalPageHeader title="Health forms" backTo="/my/programs" backLabel="My camps" />
        <PortalSection id="done" title="Received">
          <div className="flex items-start gap-3">
            <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Health information for {location?.view.profileName ?? "this profile"} is on file. A
              camp nurse reviews the physician form before it moves to complete.
            </p>
          </div>
        </PortalSection>
        <PortalNotice tone="open-question" title="Retention has not been decided">
          Records like this are set to expire 365 days after submission, with a reminder at day 330.
          Whether an expired record is automatically deleted, or only flagged for review, is still
          an open question for the team — this wireframe deliberately does not answer it.
        </PortalNotice>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Health forms"
        description={`Step ${step} of ${STEP_COUNT}`}
        backTo="/my/programs"
        backLabel="My camps"
      />
      <FormContextBanner location={location} />

      {step === 1 ? (
        <PortalSection id="history" title="Medical history">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Any of the following?</Label>
              <div className="mt-2 space-y-2">
                {COMMON_CONDITIONS.map((condition) => (
                  <Label
                    key={condition}
                    className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                  >
                    <Checkbox
                      checked={draft.conditions.includes(condition)}
                      onCheckedChange={() =>
                        setDraft((value) => ({
                          ...value,
                          conditions: toggle(value.conditions, condition),
                        }))
                      }
                    />
                    {condition}
                  </Label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                className="mt-1"
                placeholder="Food, medication or environmental allergies, and the reaction"
                value={draft.allergies}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, allergies: event.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="medications">Current medications</Label>
              <Textarea
                id="medications"
                className="mt-1"
                placeholder="Name, dose and schedule"
                value={draft.medications}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, medications: event.target.value }))
                }
              />
            </div>
          </div>
          <StepNav onNext={() => setStep(2)} />
        </PortalSection>
      ) : null}

      {step === 2 ? (
        <PortalSection id="physician" title="Physician form and immunizations">
          <div className="space-y-4">
            <div className="rounded-md border border-dashed border-border p-4 text-center">
              <Upload aria-hidden className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Have a physician sign the standard camp health form, then upload it here.
              </p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent">
                Choose file
                <input
                  type="file"
                  className="sr-only"
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      physicianFileName: event.target.files?.[0]?.name ?? value.physicianFileName,
                    }))
                  }
                />
              </label>
              {draft.physicianFileName ? (
                <p className="mt-2 text-xs font-medium text-foreground">
                  Selected: {draft.physicianFileName}
                </p>
              ) : null}
            </div>

            <div>
              <Label className="text-sm font-medium">Immunizations on file</Label>
              <div className="mt-2 space-y-2">
                {IMMUNIZATIONS.map((item) => (
                  <Label
                    key={item}
                    className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                  >
                    <Checkbox
                      checked={draft.immunizationsConfirmed.includes(item)}
                      onCheckedChange={() =>
                        setDraft((value) => ({
                          ...value,
                          immunizationsConfirmed: toggle(value.immunizationsConfirmed, item),
                        }))
                      }
                    />
                    {item}
                  </Label>
                ))}
              </div>
            </div>
          </div>
          <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </PortalSection>
      ) : null}

      {step === 3 ? (
        <PortalSection
          id="insurance"
          title="Insurance and address"
          description="The full street address is collected here — the application never asks for one, because nothing on it used to read it."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="insurance-provider">Insurance provider</Label>
                <Input
                  id="insurance-provider"
                  className="mt-1"
                  value={draft.insuranceProvider}
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, insuranceProvider: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="insurance-member">Member ID</Label>
                <Input
                  id="insurance-member"
                  className="mt-1"
                  value={draft.insuranceMemberId}
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, insuranceMemberId: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Front and back of the insurance card can be uploaded here in a full build. This
              wireframe collects the two fields above instead.
            </div>

            <div>
              <Label htmlFor="addr1">Street address</Label>
              <Input
                id="addr1"
                className="mt-1"
                value={draft.addressLine1}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, addressLine1: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="addr2">Apartment, suite, etc. (optional)</Label>
              <Input
                id="addr2"
                className="mt-1"
                value={draft.addressLine2}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, addressLine2: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <Label htmlFor="addr-city">City</Label>
                <Input
                  id="addr-city"
                  className="mt-1"
                  value={draft.city}
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, city: event.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="addr-state">State</Label>
                <Input
                  id="addr-state"
                  className="mt-1 uppercase"
                  maxLength={2}
                  value={draft.state}
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, state: event.target.value.toUpperCase() }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="addr-zip">ZIP</Label>
                <Input
                  id="addr-zip"
                  className="mt-1"
                  value={draft.postalCode}
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, postalCode: event.target.value }))
                  }
                  required
                />
              </div>
            </div>
          </div>
          <StepNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </PortalSection>
      ) : null}

      {step === 4 ? (
        <PortalSection id="consent" title="Review and consent">
          <div className="space-y-4">
            <PortalNotice tone="privacy" title="HIPAA notice">
              Health information is shared only with the camp's health team and used only to keep
              this participant safe on-site. It is not shared with camp leadership, staffing
              decisions or any other program.
            </PortalNotice>
            <PortalNotice tone="open-question" title="How long we keep it">
              This record expires 365 days after submission, with a reminder sent at day 330.
              Whether it is then deleted automatically is still undecided — ask before assuming
              either answer.
            </PortalNotice>

            <Label className="flex cursor-pointer items-start gap-2 text-sm">
              <Checkbox
                checked={draft.hipaaAcknowledged}
                onCheckedChange={(checked) =>
                  setDraft((value) => ({ ...value, hipaaAcknowledged: checked === true }))
                }
                className="mt-0.5"
              />
              <span>
                I understand how this health information will be used and am authorized to submit it
                on this participant's behalf.
              </span>
            </Label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => setStep(3)}>
              <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!draft.hipaaAcknowledged}
              onClick={() => {
                setSubmitted(true);
                onComplete?.();
              }}
            >
              <ShieldCheck aria-hidden className="size-4" />
              Submit health forms
            </Button>
          </div>
        </PortalSection>
      ) : null}
    </div>
  );
}

function StepNav({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      {onBack ? (
        <Button type="button" variant="secondary" onClick={onBack}>
          <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
          Back
        </Button>
      ) : null}
      <Button type="button" className="flex-1" onClick={onNext}>
        Continue
        <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}

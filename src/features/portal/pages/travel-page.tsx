import { ChevronLeft, ChevronRight, LayoutList, ListOrdered, Plane } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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

import type { ChecklistEntryLocation } from "../checklist-view";
import { FormContextBanner } from "../components/form-context-banner";
import { PortalNotice } from "../components/portal-notice";
import { PortalPageHeader } from "../components/portal-page-header";
import { PortalSection } from "../components/portal-section";

type TravelMode = "flying" | "driving" | "camp_bus";

interface TravelDraft {
  readonly mode: TravelMode | "";
  readonly airline: string;
  readonly flightNumber: string;
  readonly arrivalTime: string;
  readonly driverName: string;
  readonly vehiclePlate: string;
  readonly needsPickup: boolean;
  readonly pickupNotes: string;
  readonly emergencyContactName: string;
  readonly emergencyContactPhone: string;
}

function emptyDraft(): TravelDraft {
  return {
    mode: "",
    airline: "",
    flightNumber: "",
    arrivalTime: "",
    driverName: "",
    vehiclePlate: "",
    needsPickup: false,
    pickupNotes: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  };
}

/** One page in the wizard render — a group of fields shown or skipped together. */
interface TravelStep {
  readonly id: string;
  readonly title: string;
  /** False hides the whole step — the wizard's version of conditional visibility. */
  readonly visible: (draft: TravelDraft) => boolean;
}

const STEPS: readonly TravelStep[] = [
  { id: "mode", title: "How are they getting there?", visible: () => true },
  { id: "flying", title: "Flight details", visible: (draft) => draft.mode === "flying" },
  { id: "driving", title: "Driver details", visible: (draft) => draft.mode === "driving" },
  {
    id: "pickup",
    title: "Airport pickup",
    visible: (draft) => draft.mode === "flying",
  },
  { id: "emergency", title: "Emergency contact", visible: () => true },
];

/**
 * A camp-defined travel form.
 *
 * The fields a real camp asks for vary by session, which is why this is
 * built as small conditional groups rather than one fixed layout — "driver
 * details" only exists at all once "Driving" is chosen, the same way a
 * camp-authored form would only render the questions that apply. Rendered
 * two ways on purpose: stacked, so everything is visible on one scroll for
 * a family filling it in once, or step-by-step, which is closer to what a
 * camp with a longer form might choose instead.
 */
export function TravelPage({
  location,
  onComplete,
}: {
  location: ChecklistEntryLocation | null;
  onComplete?: (() => void) | undefined;
}) {
  const [draft, setDraft] = useState<TravelDraft>(emptyDraft);
  const [renderMode, setRenderMode] = useState<"stacked" | "wizard">("stacked");
  const [wizardIndex, setWizardIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const visibleSteps = useMemo(() => STEPS.filter((step) => step.visible(draft)), [draft]);
  const clampedIndex = Math.min(wizardIndex, visibleSteps.length - 1);

  function patch(next: Partial<TravelDraft>) {
    setDraft((value) => ({ ...value, ...next }));
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <PortalPageHeader title="Travel details" backTo="/my/programs" backLabel="My camps" />
        <PortalSection id="done" title="Saved">
          <p className="text-sm text-muted-foreground">
            Travel details for {location?.view.profileName ?? "this profile"} are on file. The camp
            team will reach out if anything about pickup or drop-off needs confirming.
          </p>
        </PortalSection>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Travel details" backTo="/my/programs" backLabel="My camps" />
      <FormContextBanner location={location} />

      <PortalNotice tone="info" title="Camp-defined">
        Every field below is something a camp chose to ask, and which ones show depends on the
        answers above — Al-Ummah's own travel form would ask something different.
      </PortalNotice>

      <div className="flex justify-end gap-1">
        <Button
          type="button"
          size="sm"
          variant={renderMode === "stacked" ? "default" : "secondary"}
          onClick={() => setRenderMode("stacked")}
        >
          <LayoutList aria-hidden className="size-4" />
          One page
        </Button>
        <Button
          type="button"
          size="sm"
          variant={renderMode === "wizard" ? "default" : "secondary"}
          onClick={() => setRenderMode("wizard")}
        >
          <ListOrdered aria-hidden className="size-4" />
          Step by step
        </Button>
      </div>

      {renderMode === "stacked" ? (
        <div className="space-y-6">
          {visibleSteps.map((step) => (
            <PortalSection key={step.id} id={step.id} title={step.title}>
              <TravelStepFields stepId={step.id} draft={draft} onChange={patch} />
            </PortalSection>
          ))}
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setSubmitted(true);
              onComplete?.();
            }}
          >
            <Plane aria-hidden className="size-4" />
            Save travel details
          </Button>
        </div>
      ) : (
        <PortalSection
          id="wizard-step"
          title={visibleSteps[clampedIndex]?.title ?? ""}
          description={`Step ${clampedIndex + 1} of ${visibleSteps.length}`}
        >
          {visibleSteps[clampedIndex] ? (
            <TravelStepFields
              stepId={visibleSteps[clampedIndex].id}
              draft={draft}
              onChange={patch}
            />
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {clampedIndex > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setWizardIndex(clampedIndex - 1)}
              >
                <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
                Back
              </Button>
            ) : null}
            {clampedIndex < visibleSteps.length - 1 ? (
              <Button
                type="button"
                className="flex-1"
                onClick={() => setWizardIndex(clampedIndex + 1)}
              >
                Continue
                <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  setSubmitted(true);
                  onComplete?.();
                }}
              >
                <Plane aria-hidden className="size-4" />
                Save travel details
              </Button>
            )}
          </div>
        </PortalSection>
      )}
    </div>
  );
}

function TravelStepFields({
  stepId,
  draft,
  onChange,
}: {
  stepId: string;
  draft: TravelDraft;
  onChange: (patch: Partial<TravelDraft>) => void;
}) {
  if (stepId === "mode") {
    return (
      <div>
        <Label htmlFor="travel-mode">Method of travel</Label>
        <Select
          {...(draft.mode ? { value: draft.mode } : {})}
          onValueChange={(next) => onChange({ mode: next as TravelMode })}
        >
          <SelectTrigger id="travel-mode" className="mt-1">
            <SelectValue placeholder="Choose one" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flying">Flying</SelectItem>
            <SelectItem value="driving">Being driven</SelectItem>
            <SelectItem value="camp_bus">Camp-arranged bus</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (stepId === "flying") {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="travel-airline">Airline</Label>
          <Input
            id="travel-airline"
            className="mt-1"
            value={draft.airline}
            onChange={(event) => onChange({ airline: event.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="travel-flight">Flight number</Label>
            <Input
              id="travel-flight"
              className="mt-1"
              value={draft.flightNumber}
              onChange={(event) => onChange({ flightNumber: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="travel-arrival">Arrival time</Label>
            <Input
              id="travel-arrival"
              type="time"
              className="mt-1"
              value={draft.arrivalTime}
              onChange={(event) => onChange({ arrivalTime: event.target.value })}
            />
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "driving") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="travel-driver">Driver's name</Label>
          <Input
            id="travel-driver"
            className="mt-1"
            value={draft.driverName}
            onChange={(event) => onChange({ driverName: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="travel-plate">License plate</Label>
          <Input
            id="travel-plate"
            className="mt-1"
            value={draft.vehiclePlate}
            onChange={(event) => onChange({ vehiclePlate: event.target.value })}
          />
        </div>
      </div>
    );
  }

  if (stepId === "pickup") {
    return (
      <div className="space-y-3">
        <Label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={draft.needsPickup}
            onCheckedChange={(checked) => onChange({ needsPickup: checked === true })}
          />
          Needs a ride from the airport
        </Label>
        {draft.needsPickup ? (
          <div>
            <Label htmlFor="travel-pickup-notes">Notes for the pickup team</Label>
            <Input
              id="travel-pickup-notes"
              className="mt-1"
              value={draft.pickupNotes}
              onChange={(event) => onChange({ pickupNotes: event.target.value })}
              placeholder="e.g. traveling with a younger sibling"
            />
          </div>
        ) : null}
      </div>
    );
  }

  // "emergency"
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label htmlFor="travel-ec-name">Emergency contact name</Label>
        <Input
          id="travel-ec-name"
          className="mt-1"
          value={draft.emergencyContactName}
          onChange={(event) => onChange({ emergencyContactName: event.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="travel-ec-phone">Emergency contact phone</Label>
        <Input
          id="travel-ec-phone"
          className="mt-1"
          value={draft.emergencyContactPhone}
          onChange={(event) => onChange({ emergencyContactPhone: event.target.value })}
        />
      </div>
    </div>
  );
}

import { Download, FileSignature, PenLine, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { ChecklistEntryLocation } from "../checklist-view";
import { FormContextBanner } from "../components/form-context-banner";
import { PortalNotice } from "../components/portal-notice";
import { PortalPageHeader } from "../components/portal-page-header";
import { PortalSection } from "../components/portal-section";

interface WaiverDefinition {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
}

/** Standing across every camp — a real build would come from the checklist's camp. */
const ASSIGNED_WAIVERS: readonly WaiverDefinition[] = [
  {
    id: "waiver_participation",
    title: "Participation and liability waiver",
    summary:
      "Acknowledges the physical and emotional nature of camp activities and releases JMC from ordinary program risk.",
  },
  {
    id: "waiver_media",
    title: "Media consent",
    summary: "Allows photos and video from camp to be used in JMC newsletters and social media.",
  },
  {
    id: "waiver_transport",
    title: "Transportation consent",
    summary: "Permits camp-arranged transportation between the Jamatkhana and the camp site.",
  },
];

interface SignedState {
  readonly typedName: string;
  readonly date: string;
  readonly method: "draw" | "type";
}

/**
 * Assigned waivers, signed one at a time.
 *
 * The signature itself is drawn on a canvas or, for anyone who would rather
 * not draw with a mouse, typed — both count as a signature here, and neither
 * is fed anywhere but this in-memory demo. Nothing is uploaded or persisted.
 */
export function WaiversPage({
  location,
  onComplete,
}: {
  location: ChecklistEntryLocation | null;
  onComplete?: (() => void) | undefined;
}) {
  const [signed, setSigned] = useState<Record<string, SignedState>>({});
  const [openWaiverId, setOpenWaiverId] = useState<string | null>(null);

  const allSigned = ASSIGNED_WAIVERS.every((waiver) => signed[waiver.id]);

  return (
    <div className="space-y-6">
      <PortalPageHeader title="Waivers" backTo="/my/programs" backLabel="My camps" />
      <FormContextBanner location={location} />

      <PortalSection
        id="waivers"
        title="Assigned waivers"
        description={`${Object.keys(signed).length} of ${ASSIGNED_WAIVERS.length} signed`}
      >
        <ul className="space-y-3">
          {ASSIGNED_WAIVERS.map((waiver) => {
            const state = signed[waiver.id];
            const open = openWaiverId === waiver.id;
            return (
              <li key={waiver.id} className="rounded-lg border border-border p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <FileSignature
                        aria-hidden
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      {waiver.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{waiver.summary}</p>
                  </div>
                </div>

                {state ? (
                  <div className="mt-3 flex flex-col gap-2 rounded-md bg-secondary p-3 text-sm text-secondary-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Signed by <strong>{state.typedName}</strong> on {state.date}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadSignedCopy(waiver.title, state)}
                    >
                      <Download aria-hidden className="size-4" />
                      Download signed copy
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setOpenWaiverId(open ? null : waiver.id)}
                    >
                      {open ? "Close" : "Review and sign"}
                    </Button>
                  </div>
                )}

                {open && !state ? (
                  <SignaturePanel
                    onSign={(state) => {
                      setSigned((value) => ({ ...value, [waiver.id]: state }));
                      setOpenWaiverId(null);
                    }}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </PortalSection>

      {allSigned ? (
        <PortalNotice tone="info" title="All set">
          Every assigned waiver is signed.{" "}
          {location ? "This item is now marked done on the checklist." : ""}
        </PortalNotice>
      ) : null}

      {allSigned && onComplete ? <CompleteOnce onComplete={onComplete} /> : null}
    </div>
  );
}

/** Fires `onComplete` once, the first render after every waiver is signed. */
function CompleteOnce({ onComplete }: { onComplete: () => void }) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onComplete();
  }, [onComplete]);
  return null;
}

function downloadSignedCopy(title: string, state: SignedState) {
  const text = `${title}\n\nSigned by: ${state.typedName}\nDate: ${state.date}\nMethod: ${state.method === "draw" ? "Drawn signature" : "Typed name"}\n\nThis is a wireframe demo file — no real waiver record exists behind it.\n`;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-signed.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function SignaturePanel({ onSign }: { onSign: (state: SignedState) => void }) {
  const [method, setMethod] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [date, setDate] = useState("");
  const [hasDrawing, setHasDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  // Client-only default so SSR and the first hydration pass render the same
  // empty field; the real "today" fills in a moment later, on mount.
  useEffect(() => {
    setDate((value) => (value === "" ? new Date().toISOString().slice(0, 10) : value));
  }, []);

  function pointerPosition(
    canvas: HTMLCanvasElement,
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    const context = canvas.getContext("2d");
    const { x, y } = pointerPosition(canvas, event);
    context?.beginPath();
    context?.moveTo(x, y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current) return;
    const context = canvas.getContext("2d");
    const { x, y } = pointerPosition(canvas, event);
    if (!context) return;
    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "currentColor";
    context.lineTo(x, y);
    context.stroke();
    setHasDrawing(true);
  }

  function endDraw() {
    drawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  }

  const canSign =
    date.trim().length > 0 && (method === "type" ? typedName.trim().length > 0 : hasDrawing);

  return (
    <div className="mt-4 space-y-4 rounded-md border border-dashed border-border p-3 sm:p-4">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={method === "draw" ? "default" : "secondary"}
          onClick={() => setMethod("draw")}
        >
          <PenLine aria-hidden className="size-4" />
          Draw
        </Button>
        <Button
          type="button"
          size="sm"
          variant={method === "type" ? "default" : "secondary"}
          onClick={() => setMethod("type")}
        >
          <Type aria-hidden className="size-4" />
          Type instead
        </Button>
      </div>

      {method === "draw" ? (
        <div>
          <canvas
            ref={canvasRef}
            width={320}
            height={120}
            className="w-full touch-none rounded-md border border-input bg-background text-foreground"
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
          />
          <button
            type="button"
            onClick={clearCanvas}
            className="mt-1 text-xs text-muted-foreground underline underline-offset-2"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="sig-name">Typed full name</Label>
          <Input
            id="sig-name"
            className="mt-1"
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
            placeholder="Legal name of the signer"
          />
        </div>
        <div>
          <Label htmlFor="sig-date">Date</Label>
          <Input
            id="sig-date"
            type="date"
            className="mt-1"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={!canSign || typedName.trim().length === 0}
        onClick={() => onSign({ typedName: typedName.trim(), date, method })}
      >
        Sign and continue
      </Button>
    </div>
  );
}

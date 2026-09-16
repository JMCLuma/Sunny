import { cn } from "@/lib/utils";

// Swap for real imagery later; a lightweight CSS/SVG stand-in for the mockup art.
export function PlaceholderIllustration({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100", className)}
    >
      <div className="absolute left-1/2 top-1/3 flex -translate-x-1/2 -translate-y-1/2 items-end">
        <span className="size-5 rounded-full bg-white" />
        <span className="-ml-2 size-9 rounded-full bg-white" />
        <span className="-ml-2 size-5 rounded-full bg-white" />
      </div>
      <svg
        className="absolute inset-x-0 bottom-0 h-1/2 w-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <path d="M0 25 Q 25 10 50 22 T 100 18 V40 H0 Z" fill="#8bc34a" />
        <path d="M0 32 Q 30 20 60 30 T 100 28 V40 H0 Z" fill="#4caf50" />
      </svg>
    </div>
  );
}

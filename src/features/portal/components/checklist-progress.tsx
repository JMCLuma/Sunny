import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * "3 of 5 done" with the bar under it.
 *
 * The count leads and the bar follows, because a bar alone cannot say whether
 * two items are left or twelve — and on this screen the remaining count is the
 * number a parent is actually doing arithmetic with.
 *
 * The bar is `aria-hidden` and the sentence carries the meaning, so a screen
 * reader hears "3 of 5 items done" rather than "58 percent".
 */
export function ChecklistProgressBar({
  completed,
  total,
  className,
}: {
  completed: number;
  total: number;
  className?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-sm font-medium">
        <span className="tabular-nums">{completed}</span> of{" "}
        <span className="tabular-nums">{total}</span> done
      </p>
      <Progress value={percent} aria-hidden className="h-2" />
    </div>
  );
}

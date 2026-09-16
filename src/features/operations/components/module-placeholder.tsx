import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { OperationsModule } from "../navigation";

/**
 * Every module except the overview renders this in Phase 1.
 *
 * Intentionally free of buttons, forms and charts: a control that does nothing
 * reads as broken, and this phase builds the foundation, not the workflows.
 */
export function ModulePlaceholder({ module }: { module: OperationsModule }) {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-foreground">{module.purpose}</p>
      <Alert>
        <AlertTitle>Not configured yet</AlertTitle>
        <AlertDescription>
          {module.label} is part of the Operations foundation. Its screens, data and workflows are
          scheduled for a future phase.
        </AlertDescription>
      </Alert>
    </div>
  );
}

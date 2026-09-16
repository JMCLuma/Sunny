import { ModulePlaceholder } from "../components/module-placeholder";
import { getOperationsModule, type OperationsModuleId } from "../navigation";

/**
 * Stands in for every module that has not been built yet. The module registry
 * supplies the name and purpose, so a placeholder never drifts from the label
 * in the sidebar.
 */
export function ModulePage({ moduleId }: { moduleId: OperationsModuleId }) {
  return <ModulePlaceholder module={getOperationsModule(moduleId)} />;
}

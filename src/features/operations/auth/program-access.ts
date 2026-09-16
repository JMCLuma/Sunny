import type { Id, RegionId } from "../domain";
import type { AuthorizationService, OperationsAction } from "./types";

/**
 * Scope decisions for the Programs module.
 *
 * The `AuthorizationService` answers "may this actor do X at scope Y?". This
 * policy turns that into the three questions Programs actually asks, and
 * memoizes them so a list of a hundred rows costs a handful of evaluations.
 *
 * It is deliberately pure and free of React, routing and data access: routes
 * apply it to whatever the repository returned, before rendering.
 *
 * This is UI gating, not the security boundary. The identical rules must be
 * expressed as Row Level Security policies when Supabase lands — a region
 * grant must return no rows for another region's instances, not merely hide
 * them in the browser.
 */

/** The minimum an instance must expose for a scope decision. */
export interface InstanceScopeRef {
  readonly id: Id;
  readonly programId: Id;
  readonly regionId: RegionId;
}

/** The minimum an event must expose for a scope decision. */
export interface EventScopeRef {
  readonly programId: Id;
  readonly programInstanceIds: readonly Id[];
}

export interface ProgramAccessPolicy {
  /** True when the actor reaches the program itself, ignoring its instances. */
  canViewProgramDirectly(programId: Id): boolean;
  /**
   * True when the actor reaches the program at all — directly, or because at
   * least one of its instances falls inside a granted region.
   */
  canViewProgram(programId: Id): boolean;
  canViewInstance(instance: InstanceScopeRef): boolean;
  /**
   * An event is reachable when its program is, and — if it names instances —
   * at least one of those instances is reachable. A regional actor therefore
   * sees a shared training only through the instance that concerns them.
   */
  canViewEvent(event: EventScopeRef): boolean;
}

/**
 * @param instances every instance relevant to the decision. Program-level
 * answers are only as good as this list, so pass the instances the caller
 * already loaded for the program(s) in play.
 */
export function createProgramAccessPolicy(
  authorization: AuthorizationService,
  instances: readonly InstanceScopeRef[],
  action: OperationsAction = "view",
): ProgramAccessPolicy {
  const instancesById = new Map<Id, InstanceScopeRef>(
    instances.map((instance) => [instance.id, instance]),
  );
  const instancesByProgram = new Map<Id, InstanceScopeRef[]>();
  for (const instance of instances) {
    const bucket = instancesByProgram.get(instance.programId);
    if (bucket) bucket.push(instance);
    else instancesByProgram.set(instance.programId, [instance]);
  }

  const holdsEverything = authorization.can({ resource: "programs", action, scope: "all" });

  const directCache = new Map<Id, boolean>();
  const programCache = new Map<Id, boolean>();
  const instanceCache = new Map<Id, boolean>();

  function canViewProgramDirectly(programId: Id): boolean {
    if (holdsEverything) return true;
    const cached = directCache.get(programId);
    if (cached !== undefined) return cached;

    const allowed =
      authorization.can({ resource: "programs", action, scope: "program", programId }) ||
      authorization.can({ resource: "programs", action, scope: "assigned_program", programId });

    directCache.set(programId, allowed);
    return allowed;
  }

  function canViewInstance(instance: InstanceScopeRef): boolean {
    if (holdsEverything) return true;
    const cached = instanceCache.get(instance.id);
    if (cached !== undefined) return cached;

    const allowed =
      canViewProgramDirectly(instance.programId) ||
      authorization.can({
        resource: "programs",
        action,
        scope: "region",
        organizationId: instance.regionId,
        programId: instance.programId,
      });

    instanceCache.set(instance.id, allowed);
    return allowed;
  }

  function canViewProgram(programId: Id): boolean {
    if (holdsEverything) return true;
    const cached = programCache.get(programId);
    if (cached !== undefined) return cached;

    const allowed =
      canViewProgramDirectly(programId) ||
      (instancesByProgram.get(programId) ?? []).some((instance) => canViewInstance(instance));

    programCache.set(programId, allowed);
    return allowed;
  }

  function canViewEvent(event: EventScopeRef): boolean {
    if (holdsEverything) return true;
    if (!canViewProgram(event.programId)) return false;
    if (event.programInstanceIds.length === 0) return true;

    return event.programInstanceIds.some((instanceId) => {
      const instance = instancesById.get(instanceId);
      // An unknown link cannot be shown to be in scope, so it is not.
      return instance !== undefined && canViewInstance(instance);
    });
  }

  return { canViewProgramDirectly, canViewProgram, canViewInstance, canViewEvent };
}

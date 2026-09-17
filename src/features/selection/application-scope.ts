import type { ProgramInstance } from "@/features/operations/domain";
import type { ApplicationScopeRef } from "./access";

/**
 * Turns a raw `ProgramInstance` into the minimal shape
 * `createApplicationAccessPolicy` needs.
 *
 * A route loader always builds the policy from *every* instance the
 * repository knows about — never the filtered page — so a URL filter can
 * never widen what an actor is allowed to see. Every Applications route reads
 * `repository.listProgramInstances()` and maps it through this function
 * before constructing its policy, which is what keeps that rule from being
 * reimplemented five slightly different ways.
 */
export function toApplicationScopeRef(instance: ProgramInstance): ApplicationScopeRef {
  return {
    instanceId: instance.id,
    programId: instance.programId,
    regionId: instance.organizationId,
  };
}

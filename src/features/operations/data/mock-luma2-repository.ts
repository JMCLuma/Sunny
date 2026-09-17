import {
  ageAt,
  evaluateEligibility,
  type Account,
  type ApplicationAnswer,
  type ApplicationForm,
  type ApplicationScore,
  type ApplicationStatus,
  type ApplicationSubmission,
  type ChecklistEntry,
  type ChecklistProgress,
  type CriterionScore,
  type DecisionOutcome,
  type EligibilityAudience,
  type EligibilitySubject,
  type Id,
  type Interview,
  type Invitation,
  type MatchOutcome,
  type MatchReview,
  type PersonRelationship,
  type Profile,
  type RelationshipAccessGrant,
  type ScoringRubric,
  type SelectionDecision,
} from "../domain";
import { organizations, people, programInstances, programs } from "./mock-data";
import {
  ACCESS_GRANTS,
  ACCOUNTS,
  APPLICATION_FORMS,
  CHECKLIST_DEFINITIONS,
  CHECKLIST_PROGRESS,
  COHORT_APPLICANT_LABELS,
  DECISIONS,
  DEMO_REFERENCE_DATE,
  ELIGIBILITY_CRITERIA,
  INTERVIEWS,
  INVITATIONS,
  MATCH_REVIEWS,
  PROFILES,
  RELATIONSHIPS,
  RUBRICS,
  SCORES,
  SUBMISSIONS,
} from "./mock-luma2-data";
import type {
  ApplicationQueueFilters,
  ApplicationQueueRow,
  ApplicationsRepository,
  ChecklistView,
  EligibleInstanceRow,
  HouseholdOverview,
  IdentityRepository,
  MatchReviewRow,
  PersonDirectoryRow,
  PortalDeadline,
  PortalRepository,
  ProfileDraft,
  ProfileSummary,
  SelectionBoard,
  SubmissionDetail,
  SubmissionSummary,
} from "./repository";

/**
 * Mock implementation of the identity, applications and portal contracts.
 *
 * ## Why this one can write
 *
 * Everything the Operations foundation shipped was read-only, which was right
 * for screens that only display. A wireframe cannot be: the demo has to let
 * someone fill in an application, submit it, and find it waiting in the
 * selection queue. That round trip is the single most persuasive thing the
 * prototype does, and it needs writes.
 *
 * Writes land in an in-memory overlay rather than a store that outlives the
 * page. Two reasons, both deliberate:
 *
 * 1. **No hydration risk.** The server starts every request from the pristine
 *    seed, so server and client markup always agree. An overlay restored from
 *    browser storage would make the first client render disagree with the
 *    server's, and a demo that flickers or throws a hydration error in front
 *    of leadership is worse than one that forgets.
 * 2. **A reload resets the demo.** Between run-throughs that is a feature, not
 *    a loss — the presenter gets a clean deck without clearing anything.
 *
 * Save-and-resume therefore works across navigation within a session, which is
 * what the flow needs to show. It does not survive a browser refresh, and
 * WIREFRAME.md says so plainly rather than letting anyone assume otherwise.
 *
 * Against Supabase, the overlay becomes rows and every call site stays put.
 */

interface Overlay {
  readonly submissions: Map<Id, ApplicationSubmission>;
  readonly profiles: Map<Id, Profile>;
  readonly scores: ApplicationScore[];
  readonly decisions: SelectionDecision[];
  readonly checklistProgress: Map<string, ChecklistProgress>;
  readonly matchReviews: Map<Id, MatchReview>;
}

function createOverlay(): Overlay {
  return {
    submissions: new Map(),
    profiles: new Map(),
    scores: [],
    decisions: [],
    checklistProgress: new Map(),
    matchReviews: new Map(),
  };
}

/**
 * One overlay per process on the client, a fresh one per request on the server.
 *
 * `globalThis` rather than a module constant so a dev-server hot reload does
 * not silently discard a half-filled application mid-demo.
 */
const OVERLAY_KEY = "__luma_demo_overlay__";

function overlay(): Overlay {
  if (typeof window === "undefined") return createOverlay();
  const host = globalThis as Record<string, unknown>;
  if (!host[OVERLAY_KEY]) host[OVERLAY_KEY] = createOverlay();
  return host[OVERLAY_KEY] as Overlay;
}

// --- reads over seed + overlay ---------------------------------------------

function allSubmissions(): readonly ApplicationSubmission[] {
  const patched = overlay().submissions;
  const merged = SUBMISSIONS.map((submission) => patched.get(submission.id) ?? submission);
  const added = [...patched.values()].filter(
    (submission) => !SUBMISSIONS.some((seed) => seed.id === submission.id),
  );
  return [...merged, ...added];
}

function allProfiles(): readonly Profile[] {
  const patched = overlay().profiles;
  const merged = PROFILES.map((profile) => patched.get(profile.id) ?? profile);
  const added = [...patched.values()].filter(
    (profile) => !PROFILES.some((seed) => seed.id === profile.id),
  );
  return [...merged, ...added];
}

function allScores(): readonly ApplicationScore[] {
  return [...SCORES, ...overlay().scores];
}

function allDecisions(): readonly SelectionDecision[] {
  return [...DECISIONS, ...overlay().decisions];
}

function allMatchReviews(): readonly MatchReview[] {
  const patched = overlay().matchReviews;
  return MATCH_REVIEWS.map((review) => patched.get(review.id) ?? review);
}

function progressKey(definitionId: Id, profileId: Id): string {
  return `${definitionId}::${profileId}`;
}

function allChecklistProgress(): readonly ChecklistProgress[] {
  const patched = overlay().checklistProgress;
  const merged = CHECKLIST_PROGRESS.map(
    (entry) => patched.get(progressKey(entry.definitionId, entry.profileId)) ?? entry,
  );
  const added = [...patched.values()].filter(
    (entry) =>
      !CHECKLIST_PROGRESS.some(
        (seed) => seed.definitionId === entry.definitionId && seed.profileId === entry.profileId,
      ),
  );
  return [...merged, ...added];
}

// --- lookups ----------------------------------------------------------------

const programsById = new Map(programs.map((program) => [program.id, program]));
const instancesById = new Map(programInstances.map((instance) => [instance.id, instance]));
const orgsById = new Map(organizations.map((organization) => [organization.id, organization]));
const formsById = new Map(APPLICATION_FORMS.map((form) => [form.id, form]));
const accountsById = new Map(ACCOUNTS.map((account) => [account.id, account]));

function regionFor(instanceId: Id) {
  const instance = instancesById.get(instanceId);
  if (!instance) return null;
  const organization = orgsById.get(instance.organizationId);
  if (!organization || organization.kind !== "region") return null;
  return { id: organization.id, name: organization.name, code: organization.code };
}

function profileById(profileId: Id): Profile | null {
  return allProfiles().find((profile) => profile.id === profileId) ?? null;
}

function profileName(profile: Profile): string {
  return profile.preferredName ?? `${profile.legalFirstName} ${profile.legalLastName}`;
}

function daysBetween(fromIso: string, toDate: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(`${toDate}T00:00:00.000Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

function completion(submission: ApplicationSubmission): number {
  const form = formsById.get(submission.formId);
  if (!form || form.sections.length === 0) return 0;
  return submission.completedSectionIds.length / form.sections.length;
}

function applicantLabel(submission: ApplicationSubmission, blind: boolean): string {
  if (blind) return `Applicant ${submission.id.replace(/^sub_(cohort_)?/, "")}`;
  const cohortLabel = COHORT_APPLICANT_LABELS.get(submission.id);
  if (cohortLabel) return cohortLabel;
  const profile = profileById(submission.profileId);
  return profile ? profileName(profile) : "Unknown applicant";
}

function submissionAge(submission: ApplicationSubmission): number | null {
  const profile = profileById(submission.profileId);
  if (profile?.dateOfBirth) return ageAt(profile.dateOfBirth, DEMO_REFERENCE_DATE.slice(0, 10));
  const answer = submission.answers.find((entry) => entry.questionId === "q_dob");
  return typeof answer?.value === "string"
    ? ageAt(answer.value, DEMO_REFERENCE_DATE.slice(0, 10))
    : null;
}

// --- identity ---------------------------------------------------------------

function buildProfileSummary(profile: Profile): ProfileSummary {
  const submissions = allSubmissions().filter((entry) => entry.profileId === profile.id);
  const checklistNeeds = allChecklistProgress().filter(
    (entry) =>
      entry.profileId === profile.id &&
      (entry.status === "action_needed" || entry.status === "not_started"),
  );

  return {
    profile,
    age: profile.dateOfBirth ? ageAt(profile.dateOfBirth, DEMO_REFERENCE_DATE.slice(0, 10)) : null,
    openApplications: submissions.filter(
      (entry) => !["withdrawn", "rejected"].includes(entry.status),
    ).length,
    acceptedInstances: submissions.filter((entry) =>
      ["accepted", "confirmed", "onboarded"].includes(entry.status),
    ).length,
    checklistItemsNeedingAction: checklistNeeds.length,
  };
}

function buildSubmissionSummary(submission: ApplicationSubmission): SubmissionSummary {
  const profile = profileById(submission.profileId);
  const instance = instancesById.get(submission.programInstanceId);
  return {
    submission,
    programName: programsById.get(submission.programId)?.name ?? "Unknown program",
    instanceName: instance?.name ?? "Unknown session",
    profileName: profile ? profileName(profile) : "Unknown",
    deadline: formsById.get(submission.formId)?.deadline ?? null,
    completion: completion(submission),
  };
}

function buildDeadlines(accountId: Id): readonly PortalDeadline[] {
  const profiles = allProfiles().filter((profile) => profile.accountId === accountId);
  const profileIds = new Set(profiles.map((profile) => profile.id));
  const deadlines: PortalDeadline[] = [];

  for (const progress of allChecklistProgress()) {
    if (!profileIds.has(progress.profileId)) continue;
    if (progress.status === "complete" || progress.status === "waived") continue;

    const definition = CHECKLIST_DEFINITIONS.find((item) => item.id === progress.definitionId);
    if (!definition?.dueDate) continue;

    const profile = profiles.find((entry) => entry.id === progress.profileId)!;
    deadlines.push({
      label: definition.title,
      dueDate: definition.dueDate,
      profileId: profile.id,
      profileName: profileName(profile),
      programName: programsById.get(definition.programId)?.name ?? "Unknown program",
      daysUntilDue: daysBetween(DEMO_REFERENCE_DATE, definition.dueDate),
      target: definition.target,
    });
  }

  // Confirm-by dates are deadlines too, and the most consequential ones:
  // missing one moves an accepted place to the waitlist.
  for (const submission of allSubmissions()) {
    if (submission.accountId !== accountId || !submission.confirmByDate) continue;
    if (submission.status !== "accepted") continue;
    const profile = profileById(submission.profileId);
    deadlines.push({
      label: "Confirm your place",
      dueDate: submission.confirmByDate,
      profileId: submission.profileId,
      profileName: profile ? profileName(profile) : "Unknown",
      programName: programsById.get(submission.programId)?.name ?? "Unknown program",
      daysUntilDue: daysBetween(DEMO_REFERENCE_DATE, submission.confirmByDate),
      target: { kind: "none" },
    });
  }

  return deadlines.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

// --- eligibility ------------------------------------------------------------

function subjectFor(profile: Profile, account: Account | null): EligibilitySubject {
  const attended = allSubmissions().some(
    (submission) =>
      submission.profileId === profile.id && ["confirmed", "onboarded"].includes(submission.status),
  );
  return {
    dateOfBirth: profile.dateOfBirth,
    risingSecularGrade: profile.risingSecularGrade,
    risingRecGrade: profile.risingRecGrade,
    regionId: account?.regionId ?? null,
    hasAttendedBefore: attended,
  };
}

/**
 * Every instance a subject could apply to, eligible or not, with the reasoning.
 *
 * Shared by the signed-in path and the public camp finder so the two can never
 * disagree. A family told "you're eligible" before registering and "you're
 * not" after would be a worse outcome than showing nothing at all, and the
 * only way to guarantee that is one code path.
 *
 * `profileId` is null for an anonymous visitor: there is then no existing
 * application to link to, which is the only thing it is used for.
 */
function buildEligibleRows(
  subject: EligibilitySubject,
  audience: EligibilityAudience,
  profileId: Id | null,
): readonly EligibleInstanceRow[] {
  return ELIGIBILITY_CRITERIA.filter((criteria) => criteria.audience === audience)
    .map((criteria) => {
      const instance = instancesById.get(criteria.programInstanceId);
      if (!instance) return null;

      const program = programsById.get(criteria.programId);
      const form = APPLICATION_FORMS.find(
        (candidate) =>
          candidate.programInstanceId === criteria.programInstanceId &&
          candidate.audience === audience,
      );
      const existing = profileId
        ? allSubmissions().find(
            (submission) =>
              submission.profileId === profileId &&
              submission.programInstanceId === criteria.programInstanceId,
          )
        : undefined;

      return {
        instance,
        programName: program?.name ?? "Unknown program",
        programSlug: program?.slug ?? "",
        region: regionFor(instance.id),
        criteria,
        result: evaluateEligibility(criteria, subject),
        formId: form?.id ?? null,
        deadline: form?.deadline ?? null,
        existingSubmissionId: existing?.id ?? null,
      } satisfies EligibleInstanceRow as EligibleInstanceRow;
    })
    .filter((row): row is EligibleInstanceRow => row !== null);
}

// --- the repository ---------------------------------------------------------

export function createLuma2RepositorySlice(): IdentityRepository &
  ApplicationsRepository &
  PortalRepository {
  return {
    // --- identity ---
    async getAccount(accountId) {
      return accountsById.get(accountId) ?? null;
    },

    async getHouseholdOverview(accountId): Promise<HouseholdOverview | null> {
      const account = accountsById.get(accountId);
      if (!account) return null;

      const profiles = allProfiles().filter((profile) => profile.accountId === accountId);
      return {
        account,
        profiles: profiles.map(buildProfileSummary),
        submissions: allSubmissions()
          .filter((submission) => submission.accountId === accountId)
          .map(buildSubmissionSummary),
        upcomingDeadlines: buildDeadlines(accountId),
        invitations: INVITATIONS.filter(
          (invitation) => invitation.status === "pending",
        ) as readonly Invitation[],
      };
    },

    async listProfiles(accountId) {
      return allProfiles().filter((profile) => profile.accountId === accountId);
    },

    async getProfile(profileId) {
      return profileById(profileId);
    },

    async listRelationships(accountId) {
      const ids = new Set(
        allProfiles()
          .filter((profile) => profile.accountId === accountId)
          .map((profile) => profile.id),
      );
      return RELATIONSHIPS.filter(
        (relationship) => ids.has(relationship.fromProfileId) || ids.has(relationship.toProfileId),
      ) as readonly PersonRelationship[];
    },

    async listAccessGrants(accountId) {
      const ids = new Set(
        allProfiles()
          .filter((profile) => profile.accountId === accountId)
          .map((profile) => profile.id),
      );
      return ACCESS_GRANTS.filter((grant) =>
        ids.has(grant.subjectProfileId),
      ) as readonly RelationshipAccessGrant[];
    },

    async listMatchReviews(status): Promise<readonly MatchReviewRow[]> {
      return allMatchReviews()
        .filter((review) => (status ? review.status === status : true))
        .map((review) => {
          const profile = profileById(review.profileId);
          return {
            review,
            accountEmail: accountsById.get(review.accountId)?.email ?? "unknown",
            profileName: profile ? profileName(profile) : "Unknown",
          };
        });
    },

    async listPersonDirectory(search): Promise<readonly PersonDirectoryRow[]> {
      const term = search?.trim().toLowerCase();
      return people
        .filter((person) => (term ? person.displayName.toLowerCase().includes(term) : true))
        .map((person) => {
          const profile = allProfiles().find((entry) => entry.personId === person.id);
          const account = profile ? accountsById.get(profile.accountId) : undefined;
          return {
            person,
            accountStatus: account?.status ?? null,
            programCount: allSubmissions().filter((submission) => submission.personId === person.id)
              .length,
            openMatchReviews: allMatchReviews().filter(
              (review) => review.candidatePersonId === person.id && review.status === "open",
            ).length,
          };
        });
    },

    async addProfile(accountId, draft: ProfileDraft) {
      const profile: Profile = {
        id: `prof_new_${overlay().profiles.size + 1}`,
        accountId,
        personId: null,
        // Real enough to apply with, not yet trusted enough to unlock history.
        personLinkStatus: "provisional",
        kind: "household_member",
        ...draft,
        ownAccountId: null,
        createdAt: DEMO_REFERENCE_DATE,
      };
      overlay().profiles.set(profile.id, profile);
      return profile;
    },

    async updateProfile(profileId, patch) {
      const existing = profileById(profileId);
      if (!existing) throw new Error(`Unknown profile ${profileId}`);
      const updated: Profile = { ...existing, ...patch };
      overlay().profiles.set(profileId, updated);
      return updated;
    },

    async resolveProfileMatch(profileId): Promise<MatchOutcome> {
      const profile = profileById(profileId);
      if (!profile) return "no_match";
      // Only the strongest evidence links on its own; anything weaker raises a
      // review and tells the user nothing about who they might be.
      if (profile.personId) return "confirmed";
      return allMatchReviews().some(
        (review) => review.profileId === profileId && review.status === "open",
      )
        ? "uncertain"
        : "no_match";
    },

    async resolveMatchReview(reviewId, decision) {
      const existing = allMatchReviews().find((review) => review.id === reviewId);
      if (!existing) throw new Error(`Unknown match review ${reviewId}`);
      const resolved: MatchReview = {
        ...existing,
        status: decision === "link" ? "linked" : "rejected",
        resolvedAt: DEMO_REFERENCE_DATE,
        resolvedByPersonId: "person_6",
      };
      overlay().matchReviews.set(reviewId, resolved);
      return resolved;
    },

    // --- applications, applicant side ---
    async listEligibleInstances(
      profileId,
      audience: EligibilityAudience,
    ): Promise<readonly EligibleInstanceRow[]> {
      const profile = profileById(profileId);
      if (!profile) return [];
      const account = accountsById.get(profile.accountId) ?? null;
      return buildEligibleRows(subjectFor(profile, account), audience, profileId);
    },

    async getApplicationForm(formId): Promise<ApplicationForm | null> {
      return formsById.get(formId) ?? null;
    },

    async listSubmissionsForAccount(accountId) {
      return allSubmissions()
        .filter((submission) => submission.accountId === accountId)
        .map(buildSubmissionSummary);
    },

    async getSubmissionDetail(submissionId): Promise<SubmissionDetail | null> {
      const submission = allSubmissions().find((entry) => entry.id === submissionId);
      if (!submission) return null;
      const form = formsById.get(submission.formId);
      const profile = profileById(submission.profileId);
      const account = accountsById.get(submission.accountId);
      if (!form || !profile || !account) return null;

      return {
        submission,
        form,
        profile,
        account,
        programName: programsById.get(submission.programId)?.name ?? "Unknown program",
        instanceName: instancesById.get(submission.programInstanceId)?.name ?? "Unknown session",
      };
    },

    // --- applications, reviewer side ---
    async listApplicationQueue(
      filters: ApplicationQueueFilters = {},
    ): Promise<readonly ApplicationQueueRow[]> {
      const scores = allScores();
      const decisions = allDecisions();
      const term = filters.search?.trim().toLowerCase();

      return allSubmissions()
        .filter((submission) => submission.status !== "draft")
        .filter((submission) =>
          filters.programId ? submission.programId === filters.programId : true,
        )
        .filter((submission) =>
          filters.programInstanceId
            ? submission.programInstanceId === filters.programInstanceId
            : true,
        )
        .filter((submission) =>
          filters.audience ? submission.audience === filters.audience : true,
        )
        .filter((submission) => (filters.status ? submission.status === filters.status : true))
        .filter((submission) => {
          if (!filters.regionId) return true;
          return (
            instancesById.get(submission.programInstanceId)?.organizationId === filters.regionId
          );
        })
        .map((submission) => {
          const blind = filters.blind === true;
          const score = scores.find((entry) => entry.submissionId === submission.id);
          const interview = INTERVIEWS.find((entry) => entry.submissionId === submission.id);
          const decision = decisions.find((entry) => entry.submissionId === submission.id);
          const region = regionFor(submission.programInstanceId);

          return {
            submission,
            applicantLabel: applicantLabel(submission, blind),
            programName: programsById.get(submission.programId)?.name ?? "Unknown program",
            instanceName:
              instancesById.get(submission.programInstanceId)?.name ?? "Unknown session",
            regionName: region?.name ?? null,
            age: submissionAge(submission),
            totalScore: score ? Math.round(score.totalPoints) : null,
            scoredBy: scores.filter((entry) => entry.submissionId === submission.id).length,
            interviewStatus: interview?.status ?? null,
            decision: decision?.outcome ?? null,
          } satisfies ApplicationQueueRow;
        })
        .filter((row) => (term ? row.applicantLabel.toLowerCase().includes(term) : true));
    },

    async getSelectionBoard(programInstanceId): Promise<SelectionBoard | null> {
      const instance = instancesById.get(programInstanceId);
      if (!instance) return null;

      const rows = await this.listApplicationQueue({ programInstanceId });
      const countsByStatus = {} as Record<ApplicationStatus, number>;
      for (const row of rows) {
        countsByStatus[row.submission.status] = (countsByStatus[row.submission.status] ?? 0) + 1;
      }

      const byRegion = new Map<string, number>();
      for (const row of rows) {
        const label = row.regionName ?? "Unassigned";
        byRegion.set(label, (byRegion.get(label) ?? 0) + 1);
      }

      return {
        programInstanceId,
        instanceName: instance.name,
        programName: programsById.get(instance.programId)?.name ?? "Unknown program",
        plannedCapacity: instance.plannedCapacity,
        rows,
        countsByStatus,
        countsByRegion: [...byRegion.entries()]
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
        rubric: RUBRICS.find((rubric) => rubric.programInstanceId === programInstanceId) ?? null,
      };
    },

    async listEligibilityCriteria(filters = {}) {
      return ELIGIBILITY_CRITERIA.filter(
        (criteria) =>
          (filters.programId ? criteria.programId === filters.programId : true) &&
          (filters.programInstanceId
            ? criteria.programInstanceId === filters.programInstanceId
            : true) &&
          (filters.audience ? criteria.audience === filters.audience : true),
      );
    },

    async evaluateEligibilityForSubject(
      subject: EligibilitySubject,
      audience: EligibilityAudience,
    ): Promise<readonly EligibleInstanceRow[]> {
      return buildEligibleRows(subject, audience, null);
    },

    async listRubrics(programInstanceId): Promise<readonly ScoringRubric[]> {
      return programInstanceId
        ? RUBRICS.filter((rubric) => rubric.programInstanceId === programInstanceId)
        : RUBRICS;
    },

    async listScores(submissionId) {
      return allScores().filter((score) => score.submissionId === submissionId);
    },

    async listInterviews(programInstanceId): Promise<readonly Interview[]> {
      if (!programInstanceId) return INTERVIEWS;
      const ids = new Set(
        allSubmissions()
          .filter((submission) => submission.programInstanceId === programInstanceId)
          .map((submission) => submission.id),
      );
      return INTERVIEWS.filter((interview) => ids.has(interview.submissionId));
    },

    async startApplication(profileId, formId) {
      const existing = allSubmissions().find(
        (submission) => submission.profileId === profileId && submission.formId === formId,
      );
      if (existing) return existing;

      const form = formsById.get(formId);
      if (!form) throw new Error(`Unknown form ${formId}`);
      const profile = profileById(profileId);
      if (!profile) throw new Error(`Unknown profile ${profileId}`);

      const submission: ApplicationSubmission = {
        id: `sub_new_${overlay().submissions.size + 1}`,
        formId,
        programId: form.programId,
        programInstanceId: form.programInstanceId,
        audience: form.audience,
        accountId: profile.accountId,
        profileId,
        personId: profile.personId,
        status: "draft",
        formVersion: form.version,
        answers: [],
        completedSectionIds: [],
        startedAt: DEMO_REFERENCE_DATE,
        lastSavedAt: DEMO_REFERENCE_DATE,
        submittedAt: null,
        confirmByDate: null,
        backgroundCheckRequired: form.audience === "staff",
        backgroundCheckStatus: form.audience === "staff" ? "not_started" : null,
      };
      overlay().submissions.set(submission.id, submission);
      return submission;
    },

    async saveAnswers(submissionId, answers: readonly ApplicationAnswer[], completedSectionIds) {
      return patchSubmission(submissionId, (submission) => ({
        ...submission,
        answers,
        completedSectionIds,
        lastSavedAt: DEMO_REFERENCE_DATE,
      }));
    },

    async submitApplication(submissionId) {
      return patchSubmission(submissionId, (submission) => ({
        ...submission,
        status: "submitted",
        submittedAt: DEMO_REFERENCE_DATE,
        lastSavedAt: DEMO_REFERENCE_DATE,
      }));
    },

    async withdrawApplication(submissionId) {
      return patchSubmission(submissionId, (submission) => ({
        ...submission,
        status: "withdrawn",
      }));
    },

    async confirmPlace(submissionId) {
      return patchSubmission(submissionId, (submission) => ({
        ...submission,
        status: "confirmed",
      }));
    },

    async scoreApplication(submissionId, rubricId, criterionScores: readonly CriterionScore[]) {
      const rubric = RUBRICS.find((entry) => entry.id === rubricId);
      if (!rubric) throw new Error(`Unknown rubric ${rubricId}`);

      const score: ApplicationScore = {
        id: `score_new_${overlay().scores.length + 1}`,
        submissionId,
        rubricId,
        rubricVersion: rubric.version,
        reviewerPersonId: "person_5",
        blind: true,
        criterionScores,
        totalPoints: criterionScores.reduce((total, entry) => {
          const criterion = rubric.criteria.find((item) => item.id === entry.criterionId);
          return total + entry.points * (criterion?.weight ?? 1);
        }, 0),
        submittedAt: DEMO_REFERENCE_DATE,
      };
      overlay().scores.push(score);
      patchSubmission(submissionId, (submission) => ({ ...submission, status: "scored" }));
      return score;
    },

    async recordDecisions(submissionIds, outcome: DecisionOutcome, note) {
      const statusFor: Record<DecisionOutcome, ApplicationStatus> = {
        accept: "accepted",
        waitlist: "waitlisted",
        reject: "rejected",
        ineligible: "rejected",
      };

      return submissionIds.map((submissionId, index) => {
        patchSubmission(submissionId, (submission) => ({
          ...submission,
          status: statusFor[outcome],
          // An acceptance without a confirm-by date is not an acceptance: the
          // deadline is what drives the reminder and the auto-waitlist.
          confirmByDate: outcome === "accept" ? "2026-09-30" : null,
        }));

        const decision: SelectionDecision = {
          id: `dec_new_${overlay().decisions.length + index + 1}`,
          submissionId,
          outcome,
          decidedByPersonId: "person_3",
          decidedAt: DEMO_REFERENCE_DATE,
          rubricVersion: RUBRICS[0]?.version ?? null,
          emailTemplateId: null,
          releasedAt: null,
          note: note ?? null,
        };
        overlay().decisions.push(decision);
        return decision;
      });
    },

    // --- portal ---
    async listChecklists(accountId): Promise<readonly ChecklistView[]> {
      const profiles = allProfiles().filter((profile) => profile.accountId === accountId);
      const views: ChecklistView[] = [];

      for (const profile of profiles) {
        const instanceIds = new Set(
          allSubmissions()
            .filter(
              (submission) =>
                submission.profileId === profile.id &&
                ["accepted", "confirmed", "onboarded", "background_check_cleared"].includes(
                  submission.status,
                ),
            )
            .map((submission) => submission.programInstanceId),
        );

        for (const instanceId of instanceIds) {
          const view = buildChecklistView(profile, instanceId);
          if (view) views.push(view);
        }
      }

      return views;
    },

    async getChecklist(profileId, programInstanceId) {
      const profile = profileById(profileId);
      return profile ? buildChecklistView(profile, programInstanceId) : null;
    },

    async completeChecklistItem(definitionId, profileId) {
      const instance = CHECKLIST_DEFINITIONS.find((item) => item.id === definitionId);
      const progress: ChecklistProgress = {
        id: `prog_new_${definitionId}_${profileId}`,
        definitionId,
        profileId,
        programInstanceId: instance?.programInstanceId ?? "",
        status: "complete",
        subStatus: null,
        updatedAt: DEMO_REFERENCE_DATE,
        completedAt: DEMO_REFERENCE_DATE,
      };
      overlay().checklistProgress.set(progressKey(definitionId, profileId), progress);
      return progress;
    },
  };
}

function patchSubmission(
  submissionId: Id,
  update: (submission: ApplicationSubmission) => ApplicationSubmission,
): ApplicationSubmission {
  const existing = allSubmissions().find((entry) => entry.id === submissionId);
  if (!existing) throw new Error(`Unknown submission ${submissionId}`);
  const next = update(existing);
  overlay().submissions.set(submissionId, next);
  return next;
}

function buildChecklistView(profile: Profile, programInstanceId: Id): ChecklistView | null {
  const instance = instancesById.get(programInstanceId);
  if (!instance) return null;

  const definitions = CHECKLIST_DEFINITIONS.filter(
    (definition) => definition.programInstanceId === programInstanceId,
  ).sort((a, b) => a.order - b.order);
  if (definitions.length === 0) return null;

  const progressRows = allChecklistProgress();
  const entries: ChecklistEntry[] = definitions.map((definition) => {
    const progress =
      progressRows.find(
        (row) => row.definitionId === definition.id && row.profileId === profile.id,
      ) ?? null;

    return {
      definition,
      progress,
      status: progress?.status ?? "not_started",
      dueDate: definition.dueDate,
      daysUntilDue: definition.dueDate
        ? daysBetween(DEMO_REFERENCE_DATE, definition.dueDate)
        : null,
    };
  });

  return {
    profileId: profile.id,
    profileName: profileName(profile),
    programInstanceId,
    programName: programsById.get(instance.programId)?.name ?? "Unknown program",
    instanceName: instance.name,
    entries,
    completed: entries.filter((entry) => entry.status === "complete").length,
    total: entries.length,
  };
}

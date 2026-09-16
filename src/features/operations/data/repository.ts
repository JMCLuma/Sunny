import type {
  Account,
  ApplicationAnswer,
  ApplicationForm,
  ApplicationScore,
  ApplicationStatus,
  ApplicationSubmission,
  AuditEvent,
  ChecklistEntry,
  ChecklistProgress,
  ChecklistTarget,
  CriterionScore,
  DecisionOutcome,
  EligibilityAudience,
  EligibilityCriteria,
  EligibilityResult,
  Id,
  Interview,
  InterviewStatus,
  Invitation,
  LanguageProficiency,
  MatchOutcome,
  MatchReview,
  Person,
  PersonRelationship,
  Profile,
  RelationshipAccessGrant,
  SchoolType,
  ScoringRubric,
  SelectionDecision,
  IntegrationConnection,
  IsoDate,
  IsoDateTime,
  MinorUnits,
  Program,
  ProgramEvent,
  ProgramEventType,
  ProgramInstance,
  ProgramInstanceStatus,
  ReadinessArea,
  ReadinessSignal,
  ReadinessStatus,
  Region,
  RegionId,
  RequirementCategory,
  Task,
} from "../domain";

/**
 * The data contract for the Operations module.
 *
 * Every screen reads through this interface. Page components never import seed
 * arrays, never call `fetch`, and never know whether the answer came from a
 * mock, from Supabase, or from an API — which is the point: Phase 2 replaces
 * the implementation, not the pages.
 *
 * All methods are async even though the Phase 1 implementation resolves
 * immediately, so that adding real I/O later changes no call sites.
 */

/** Filters accepted by every list method. Omitted fields mean "no filter". */
export interface OperationsQuery {
  /** "Now" for upcoming/overdue calculations. Defaults to the current time. */
  readonly referenceDate?: IsoDateTime;
  readonly organizationId?: Id;
  readonly programId?: Id;
  readonly limit?: number;
}

/** One program with the counts that make the portfolio readable at a glance. */
export interface ProgramPortfolioRow {
  readonly program: Program;
  readonly activeInstances: number;
  readonly upcomingInstances: number;
  /** Distinct people holding a confirmed assignment on any instance. */
  readonly assignedPeople: number;
}

export interface UpcomingInstanceRow {
  readonly instance: ProgramInstance;
  readonly programName: string;
}

export interface UpcomingEventRow {
  readonly event: ProgramEvent;
  /** `null` for cross-program events. */
  readonly programName: string | null;
}

/** Readiness for one requirement, aggregated across people. Never per-person. */
export interface ComplianceReadinessRow {
  readonly requirementId: Id;
  readonly requirementName: string;
  readonly category: RequirementCategory;
  readonly assigned: number;
  readonly complete: number;
  readonly outstanding: number;
  readonly expiringSoon: number;
}

/** One stage of the finance review pipeline. */
export interface FinanceWorkflowRow {
  readonly stage: string;
  readonly count: number;
  readonly totalMinor: MinorUnits;
}

/**
 * Everything the Operations overview renders, assembled by the repository so
 * the page does no joining or aggregation of its own.
 */
export interface OperationsOverview {
  readonly generatedAt: IsoDateTime;
  readonly portfolio: readonly ProgramPortfolioRow[];
  readonly upcomingInstances: readonly UpcomingInstanceRow[];
  readonly upcomingEvents: readonly UpcomingEventRow[];
  readonly attention: readonly Task[];
  readonly complianceReadiness: readonly ComplianceReadinessRow[];
  readonly financeWorkflow: readonly FinanceWorkflowRow[];
  readonly recentActivity: readonly AuditEvent[];
  readonly integrations: readonly IntegrationConnection[];
}

export interface OperationsRepository
  extends ProgramsRepository, IdentityRepository, ApplicationsRepository, PortalRepository {
  getOverview(query?: OperationsQuery): Promise<OperationsOverview>;
  listPrograms(query?: OperationsQuery): Promise<readonly Program[]>;
  listProgramInstances(query?: OperationsQuery): Promise<readonly ProgramInstance[]>;
  listUpcomingProgramEvents(query?: OperationsQuery): Promise<readonly UpcomingEventRow[]>;
  listTasksRequiringAttention(query?: OperationsQuery): Promise<readonly Task[]>;
  listRecentAuditEvents(query?: OperationsQuery): Promise<readonly AuditEvent[]>;
  listIntegrationConnections(query?: OperationsQuery): Promise<readonly IntegrationConnection[]>;
}

// ---------------------------------------------------------------------------
// Programs module (Phase 2)
//
// Filters are explicit types rather than a widening bag of optional arguments,
// so a Supabase-backed implementation can translate each one to a predicate
// and the UI cannot ask a question the contract has not agreed to answer.
// ---------------------------------------------------------------------------

/** Shared by every Programs filter: what "now" means, so results are testable. */
interface ReferenceDated {
  readonly referenceDate?: IsoDateTime;
}

export interface ProgramFilters extends ReferenceDated {
  /** Case-insensitive match on a program name/slug/summary or an instance name. */
  readonly search?: string;
  readonly cycleYear?: number;
  readonly regionId?: RegionId;
  /** Keeps only instances at this lifecycle status, and programs that have one. */
  readonly status?: ProgramInstanceStatus;
}

export interface ProgramInstanceFilters extends ReferenceDated {
  readonly programId?: Id;
  readonly cycleYear?: number;
  readonly regionId?: RegionId;
  readonly status?: ProgramInstanceStatus;
  readonly search?: string;
}

export interface ProgramEventFilters extends ReferenceDated {
  readonly programId?: Id;
  readonly cycleYear?: number;
  readonly eventType?: ProgramEventType;
  /** Matches events whose linked instances include one in this region. */
  readonly regionId?: RegionId;
  /** Inclusive ISO date bounds on the event start. */
  readonly from?: IsoDate;
  readonly to?: IsoDate;
  readonly search?: string;
  /** Default false: the schedule looks forward unless asked otherwise. */
  readonly includePast?: boolean;
}

/** Readiness for one instance, counted rather than itemised for list views. */
export interface ReadinessSummary {
  readonly signals: readonly ReadinessSignal[];
  /** Areas that are neither ready nor deliberately out of scope. */
  readonly tracked: number;
  readonly ready: number;
  readonly needsAttention: number;
}

export interface ProgramInstanceSummary {
  readonly instance: ProgramInstance;
  readonly programName: string;
  /** `null` when the instance references a region that no longer exists. */
  readonly region: Region | null;
  readonly eventCount: number;
  readonly readiness: ReadinessSummary;
}

export interface ProgramSummary {
  readonly program: Program;
  /** Instances matching the active filters, in deterministic order. */
  readonly instances: readonly ProgramInstanceSummary[];
  readonly instanceCount: number;
  readonly activeInstances: number;
  readonly upcomingInstances: number;
  readonly regions: readonly Region[];
  readonly cycleYears: readonly number[];
}

export interface ProgramEventRow {
  readonly event: ProgramEvent;
  readonly programName: string;
  /** The instances this one event serves — never a duplicated event per link. */
  readonly instances: readonly LinkedInstanceRef[];
  /** Regions derived from the linked instances, de-duplicated. */
  readonly regions: readonly Region[];
}

export interface LinkedInstanceRef {
  readonly id: Id;
  readonly programId: Id;
  readonly name: string;
  readonly regionId: RegionId;
}

/** Readiness across every relevant instance of a program, by area. */
export interface ProgramReadinessRollupRow {
  readonly area: ReadinessArea;
  readonly counts: Readonly<Record<ReadinessStatus, number>>;
}

export interface ProgramDetail {
  readonly program: Program;
  /** Instances under way now. */
  readonly current: readonly ProgramInstanceSummary[];
  /** Instances not yet started, soonest first. */
  readonly upcoming: readonly ProgramInstanceSummary[];
  /** Finished or cancelled instances, most recent first. */
  readonly completed: readonly ProgramInstanceSummary[];
  readonly upcomingEvents: readonly ProgramEventRow[];
  readonly readiness: readonly ProgramReadinessRollupRow[];
}

export interface ProgramInstanceDetail {
  readonly program: Program;
  readonly instance: ProgramInstance;
  readonly region: Region | null;
  readonly events: readonly ProgramEventRow[];
  readonly readiness: readonly ReadinessSignal[];
}

/**
 * Programs reads. Added to `OperationsRepository` below rather than to a
 * parallel service, so there stays exactly one data contract to reimplement.
 */
export interface ProgramsRepository {
  /** Region catalogue — the region-kind organizations, projected for reading. */
  listRegions(): Promise<readonly Region[]>;
  /** Every cycle year present in the data, ascending. Powers the year filter. */
  listProgramCycleYears(): Promise<readonly number[]>;
  getProgram(programId: Id): Promise<Program | null>;
  listProgramSummaries(filters?: ProgramFilters): Promise<readonly ProgramSummary[]>;
  getProgramDetail(programId: Id, filters?: ReferenceDated): Promise<ProgramDetail | null>;
  listProgramInstanceSummaries(
    filters?: ProgramInstanceFilters,
  ): Promise<readonly ProgramInstanceSummary[]>;
  /**
   * Both ids are required and must agree: an instance that exists but belongs
   * to another program resolves to `null`, never to a rendered page.
   */
  getProgramInstance(programId: Id, instanceId: Id): Promise<ProgramInstance | null>;
  getProgramInstanceDetail(programId: Id, instanceId: Id): Promise<ProgramInstanceDetail | null>;
  listProgramEvents(filters?: ProgramEventFilters): Promise<readonly ProgramEventRow[]>;
}

// ---------------------------------------------------------------------------
// Luma 2.0 — identity, applications and the family portal
//
// Added to the same contract rather than beside it, for the reason the module
// README already gives: there should be exactly one interface to reimplement
// against Supabase.
//
// ## Reads and writes
//
// Everything above this line is read-only, because Phase 1 and 2 only ever
// displayed data. The wireframe cannot be: a demo where an application cannot
// be filled in, submitted, and then found waiting in Operations is a slide
// deck with extra steps. So a small number of writes are part of the contract.
//
// The mock implements them as an overlay on top of the seed data, held in the
// browser and applied after mount so a server render and the first client
// render still agree. Reloading keeps the overlay; clearing it resets the
// demo. A Supabase implementation replaces the overlay with real rows and no
// call site changes.
// ---------------------------------------------------------------------------

/** One camp a profile may (or may not) apply to, with the reasoning attached. */
export interface EligibleInstanceRow {
  readonly instance: ProgramInstance;
  readonly programName: string;
  readonly programSlug: string;
  readonly region: Region | null;
  readonly criteria: EligibilityCriteria | null;
  readonly result: EligibilityResult;
  /** The open application for this instance, when one exists. */
  readonly formId: Id | null;
  readonly deadline: IsoDate | null;
  /** Set when this profile already has an application in flight here. */
  readonly existingSubmissionId: Id | null;
}

/** A profile with everything the portal needs to show it in one row. */
export interface ProfileSummary {
  readonly profile: Profile;
  readonly age: number | null;
  readonly openApplications: number;
  readonly acceptedInstances: number;
  /** Checklist items that are overdue or need action, across every camp. */
  readonly checklistItemsNeedingAction: number;
}

/** The family dashboard, assembled so the page joins nothing itself. */
export interface HouseholdOverview {
  readonly account: Account;
  readonly profiles: readonly ProfileSummary[];
  readonly submissions: readonly SubmissionSummary[];
  /** Soonest first, across every profile and camp. Drives "what's next". */
  readonly upcomingDeadlines: readonly PortalDeadline[];
  readonly invitations: readonly Invitation[];
}

export interface PortalDeadline {
  readonly label: string;
  readonly dueDate: IsoDate;
  readonly profileId: Id;
  readonly profileName: string;
  readonly programName: string;
  /** Negative when overdue. */
  readonly daysUntilDue: number;
  readonly target: ChecklistTarget;
}

/** An application as the applicant sees it in a list. */
export interface SubmissionSummary {
  readonly submission: ApplicationSubmission;
  readonly programName: string;
  readonly instanceName: string;
  readonly profileName: string;
  readonly deadline: IsoDate | null;
  /** 0–1, by completed sections. Drives the progress bar. */
  readonly completion: number;
}

/** Everything the wizard needs for one application, in one read. */
export interface SubmissionDetail {
  readonly submission: ApplicationSubmission;
  readonly form: ApplicationForm;
  readonly profile: Profile;
  readonly account: Account;
  readonly programName: string;
  readonly instanceName: string;
}

/**
 * An application as a reviewer sees it in the queue.
 *
 * `applicantLabel` is deliberately the only identity on the row, so a blind
 * review can substitute a reference like "Applicant 14" without the table
 * needing a second shape.
 */
export interface ApplicationQueueRow {
  readonly submission: ApplicationSubmission;
  readonly applicantLabel: string;
  readonly programName: string;
  readonly instanceName: string;
  readonly regionName: string | null;
  readonly age: number | null;
  readonly totalScore: number | null;
  readonly scoredBy: number;
  readonly interviewStatus: InterviewStatus | null;
  readonly decision: DecisionOutcome | null;
}

export interface ApplicationQueueFilters {
  readonly programId?: Id;
  readonly programInstanceId?: Id;
  readonly regionId?: RegionId;
  readonly audience?: EligibilityAudience;
  readonly status?: ApplicationStatus;
  readonly search?: string;
  /** Withholds applicant identity from the returned rows. */
  readonly blind?: boolean;
}

/** Counts behind the selection screen's cohort view. */
export interface SelectionBoard {
  readonly programInstanceId: Id;
  readonly instanceName: string;
  readonly programName: string;
  readonly plannedCapacity: number;
  readonly rows: readonly ApplicationQueueRow[];
  readonly countsByStatus: Readonly<Record<ApplicationStatus, number>>;
  readonly countsByRegion: readonly { readonly label: string; readonly count: number }[];
  readonly rubric: ScoringRubric | null;
}

/** A possible duplicate, with only what a resolver needs to decide. */
export interface MatchReviewRow {
  readonly review: MatchReview;
  readonly accountEmail: string;
  readonly profileName: string;
}

/** A person as Operations sees them: one record, every thread that reaches it. */
export interface PersonDirectoryRow {
  readonly person: Person;
  readonly accountStatus: Account["status"] | null;
  readonly programCount: number;
  readonly openMatchReviews: number;
}

export interface ChecklistView {
  readonly profileId: Id;
  readonly profileName: string;
  readonly programInstanceId: Id;
  readonly programName: string;
  readonly instanceName: string;
  readonly entries: readonly ChecklistEntry[];
  readonly completed: number;
  readonly total: number;
}

/** Reads and writes for accounts, profiles and the links between them. */
export interface IdentityRepository {
  getAccount(accountId: Id): Promise<Account | null>;
  getHouseholdOverview(accountId: Id): Promise<HouseholdOverview | null>;
  listProfiles(accountId: Id): Promise<readonly Profile[]>;
  getProfile(profileId: Id): Promise<Profile | null>;
  listRelationships(accountId: Id): Promise<readonly PersonRelationship[]>;
  listAccessGrants(accountId: Id): Promise<readonly RelationshipAccessGrant[]>;
  listMatchReviews(status?: MatchReview["status"]): Promise<readonly MatchReviewRow[]>;
  listPersonDirectory(search?: string): Promise<readonly PersonDirectoryRow[]>;

  /** Adds a household member. Returns the profile, already match-checked. */
  addProfile(accountId: Id, draft: ProfileDraft): Promise<Profile>;
  updateProfile(profileId: Id, patch: Partial<ProfileDraft>): Promise<Profile>;
  /**
   * Runs the matching rules for a profile.
   *
   * May link, and may raise a review — but never reveals the candidate to the
   * requesting user. An uncertain match returns `uncertain` and nothing else.
   */
  resolveProfileMatch(profileId: Id): Promise<MatchOutcome>;
  resolveMatchReview(reviewId: Id, decision: "link" | "reject"): Promise<MatchReview>;
}

/** The fields a family can set on a profile. Everything else is derived. */
export interface ProfileDraft {
  readonly legalFirstName: string;
  readonly legalLastName: string;
  readonly preferredName: string | null;
  readonly dateOfBirth: IsoDate | null;
  readonly risingSecularGrade: number | null;
  readonly risingRecGrade: number | null;
  readonly schoolName: string | null;
  readonly schoolType: SchoolType | null;
  readonly languages: readonly LanguageProficiency[];
  readonly needsTranslator: boolean;
}

/** Applications, from the applicant's side and the reviewer's. */
export interface ApplicationsRepository {
  /** Every instance this profile could apply to, eligible or not, with reasons. */
  listEligibleInstances(
    profileId: Id,
    audience: EligibilityAudience,
  ): Promise<readonly EligibleInstanceRow[]>;
  getApplicationForm(formId: Id): Promise<ApplicationForm | null>;
  listSubmissionsForAccount(accountId: Id): Promise<readonly SubmissionSummary[]>;
  getSubmissionDetail(submissionId: Id): Promise<SubmissionDetail | null>;

  listApplicationQueue(filters?: ApplicationQueueFilters): Promise<readonly ApplicationQueueRow[]>;
  getSelectionBoard(programInstanceId: Id): Promise<SelectionBoard | null>;
  listRubrics(programInstanceId?: Id): Promise<readonly ScoringRubric[]>;
  listScores(submissionId: Id): Promise<readonly ApplicationScore[]>;
  listInterviews(programInstanceId?: Id): Promise<readonly Interview[]>;

  /** Starts an application, or returns the existing draft for this pairing. */
  startApplication(profileId: Id, formId: Id): Promise<ApplicationSubmission>;
  /** Save-and-resume. Called on every step; never loses a partly-filled form. */
  saveAnswers(
    submissionId: Id,
    answers: readonly ApplicationAnswer[],
    completedSectionIds: readonly Id[],
  ): Promise<ApplicationSubmission>;
  submitApplication(submissionId: Id): Promise<ApplicationSubmission>;
  withdrawApplication(submissionId: Id): Promise<ApplicationSubmission>;
  /** The applicant's response to an offer, before the confirm-by date. */
  confirmPlace(submissionId: Id): Promise<ApplicationSubmission>;

  scoreApplication(
    submissionId: Id,
    rubricId: Id,
    criterionScores: readonly CriterionScore[],
  ): Promise<ApplicationScore>;
  /** Bulk decisions: the selection screen applies a status to a set at once. */
  recordDecisions(
    submissionIds: readonly Id[],
    outcome: DecisionOutcome,
    note?: string,
  ): Promise<readonly SelectionDecision[]>;
}

/** The post-acceptance checklist and the family forms behind it. */
export interface PortalRepository {
  listChecklists(accountId: Id): Promise<readonly ChecklistView[]>;
  getChecklist(profileId: Id, programInstanceId: Id): Promise<ChecklistView | null>;
  /** Demo affordance: marks an item done so the dashboard visibly moves. */
  completeChecklistItem(definitionId: Id, profileId: Id): Promise<ChecklistProgress>;
}

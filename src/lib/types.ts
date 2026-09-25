// Shared data model. See scripts/build-data.mjs for how ScholarshipRecord is produced
// from the Excel workbook, and lib/matching.ts for how UserProfile is compared against it.

export type DegreeLevel = "D3" | "D4" | "S1" | "S2" | "S3" | "NonDegree";

/** A value that may be explicitly "not required", a single number, several
 * numbers keyed by tier (e.g. S2 vs S3), present-but-unparseable, or missing
 * from the source entirely. Every branch is distinguishable so the matching
 * engine can never silently treat "we don't know" as "not required". */
export type NumericRequirement =
  | { kind: "not_required"; raw: string }
  | { kind: "value"; value: number; raw: string }
  | { kind: "tiered"; tiers: { label: string; value: number }[]; raw: string }
  | { kind: "unparsed"; raw: string }
  | { kind: "absent" };

export type BooleanRequirement =
  | { kind: "yes"; raw: string }
  | { kind: "no"; raw: string }
  | { kind: "unparsed"; raw: string }
  | { kind: "absent" };

export type GenderRequirement =
  | { kind: "women_only"; raw: string }
  | { kind: "no_restriction"; raw: string }
  | { kind: "unparsed"; raw: string }
  | { kind: "absent" };

export interface TextRequirement {
  raw: string;
  present: boolean;
}

export type FundingType = "full" | "partial" | "both" | "unknown";

export interface CountryTag {
  label: string;
  confidence: "derived_from_url" | "derived_from_name";
  sourceHint: string;
}

export interface ScholarshipRecord {
  id: number;

  raw: {
    no: string;
    scholarshipName: string;
    level: string;
    openMonth: string;
    closeMonth: string;
    openDateSource: string;
    deadlineSource: string;
    requirement: string;
    benefit: string;
    resourceUrl: string;
    completeEligibilityRequirements: string;
    completeBenefits: string;
    materialsRequired: string;
  };

  levels: DegreeLevel[];

  eligibility: {
    minimumAge: NumericRequirement;
    maximumAge: NumericRequirement;
    gender: GenderRequirement;
    minGpa: NumericRequirement;
    backgroundStudy: TextRequirement;
    ielts: NumericRequirement;
    toeflItp: NumericRequirement;
    toeflIbt: NumericRequirement;
    otherEnglishReq: TextRequirement;
    workExperience: TextRequirement;
    studyPeriod: TextRequirement;
    graduatedStatus: TextRequirement;
    languageTraining: BooleanRequirement;
    otherRequirements: TextRequirement;
    language: TextRequirement;
  };

  benefits: {
    fundingType: FundingType;
    tuitionFee: BooleanRequirement;
    livingExpenses: BooleanRequirement;
    airfare: BooleanRequirement;
    healthInsurance: BooleanRequirement;
    visa: BooleanRequirement;
    arrivalAllowance: BooleanRequirement;
    otherBenefits: string;
  };

  materials: {
    essayPersonalStatement: BooleanRequirement;
    studyPlan: BooleanRequirement;
    letterOfAcceptance: BooleanRequirement;
    letterOfRecommendation: BooleanRequirement;
    transcriptGpa: BooleanRequirement;
    englishTestScores: BooleanRequirement;
    interview: BooleanRequirement;
    resumeCv: BooleanRequirement;
    financialRecords: BooleanRequirement;
    governmentStatement: BooleanRequirement;
    passportId: BooleanRequirement;
    motivationalLetter: BooleanRequirement;
    researchProposal: BooleanRequirement;
    otherMaterials: string;
  };

  countryTag: CountryTag | null;

  provenance: {
    sourceType: "DATABASE";
    sourceReference: string;
  };
}

export interface TimelineEntry {
  id: number;
  scholarshipName: string;
  level: string;
  openMonth: string;
  closeMonth: string;
  resourceUrl: string;
}

export interface MetricDefinition {
  key: string;
  category: "personal" | "education" | "language" | "experience" | "preferences";
  label: string;
  type: "number" | "boolean" | "single_choice" | "multi_choice" | "text";
  frequency: number;
  frequencyRatio: number;
}

export type GraduationStatus =
  | "still_studying"
  | "final_year"
  | "graduated_awaiting_certificate"
  | "graduated_with_diploma";

export interface UserProfile {
  personal: {
    displayName: string;
    gender?: "perempuan" | "laki-laki" | "prefer_not_say";
    age?: number;
  };
  education: {
    targetLevels: DegreeLevel[];
    fieldOfStudy?: string;
    fieldCategory?: "stem" | "social_humanities" | "business_economics" | "health" | "all" | "other";
    gpa?: number;
    graduationStatus?: GraduationStatus;
  };
  language: {
    ielts?: number;
    toeflItp?: number;
    toeflIbt?: number;
  };
  experience: {
    workExperienceYears?: number;
  };
  preferences: {
    funding: ("full" | "partial" | "none" | "all")[];
    excludedRegions: RegionKey[];
    ieltsPreference: WithWithoutAll[];
    essayPreference: WithWithoutAll[];
    interviewPreference: WithWithoutAll[];
    excludedCountryTags: string[];
  };
}

/** The four broad region buckets from the original app's "region to skip"
 * question. "other" (Australia/NZ, Canada, domestic, multi-country programs)
 * is intentionally not offered as a skip option, matching the original. */
export type RegionKey = "europe" | "asia" | "uk" | "us";

export type WithWithoutAll = "with" | "without" | "all";

export type MatchStatus = "MATCH" | "POSSIBLE_MATCH" | "NOT_ELIGIBLE" | "INSUFFICIENT_INFORMATION";

export interface CriterionCheck {
  key: string;
  label: string;
  result: "pass" | "fail" | "unknown" | "not_applicable";
  detail: string;
}

export interface MatchResult {
  scholarshipId: number;
  status: MatchStatus;
  checks: CriterionCheck[];
}

export type SourceType = "DATABASE" | "WEB_VERIFIED" | "USER_APPROVED_SOURCE";

export interface VerificationRecord {
  scholarshipId: number;
  checkedAt: string;
  reachable: boolean;
  httpStatus: number | null;
  finalUrl: string | null;
  note: string;
}

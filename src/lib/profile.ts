import { METRIC_REGISTRY } from "./scholarships";
import type { UserProfile } from "./types";

export function defaultProfile(): UserProfile {
  return {
    personal: {
      displayName: "",
    },
    education: {
      targetLevels: [],
    },
    language: {},
    experience: {},
    preferences: {
      funding: ["all"],
      excludedRegions: [],
      ieltsPreference: ["all"],
      essayPreference: ["all"],
      interviewPreference: ["all"],
      excludedCountryTags: [],
    },
  };
}

/** Whether the given metric (from the database-derived frequency registry)
 * has been answered in the profile. Metrics never collected in this app's UI
 * (e.g. rare TOEFL iBT) are simply left out of METRIC_KEY_ANSWERED below and
 * excluded from the completeness calculation entirely. */
const METRIC_KEY_ANSWERED: Record<string, (p: UserProfile) => boolean> = {
  targetLevel: (p) => p.education.targetLevels.length > 0,
  fundingType: (p) => p.preferences.funding.length > 0 && !(p.preferences.funding.length === 1 && p.preferences.funding[0] === "all"),
  gender: (p) => p.personal.gender !== undefined,
  graduatedStatus: (p) => p.education.graduationStatus !== undefined,
  backgroundStudy: (p) => Boolean(p.education.fieldOfStudy) || p.education.fieldCategory !== undefined,
  maximumAge: (p) => p.personal.age !== undefined,
  minimumAge: (p) => p.personal.age !== undefined,
  minGpa: (p) => p.education.gpa !== undefined,
  workExperience: (p) => p.experience.workExperienceYears !== undefined,
  ielts: (p) => p.language.ielts !== undefined,
  toeflItp: (p) => p.language.toeflItp !== undefined,
};

export function profileCompleteness(profile: UserProfile): number {
  let weightTotal = 0;
  let weightAnswered = 0;
  for (const metric of METRIC_REGISTRY) {
    const answered = METRIC_KEY_ANSWERED[metric.key];
    if (!answered) continue;
    weightTotal += metric.frequencyRatio;
    if (answered(profile)) weightAnswered += metric.frequencyRatio;
  }
  if (weightTotal === 0) return 0;
  return Math.round((weightAnswered / weightTotal) * 100);
}

// minimumAge and maximumAge are separate database columns but both resolve to
// the same single "age" profile question - only surface one of them so a
// limited slice of high-value questions isn't wasted on a duplicate.
const METRIC_FIELD_GROUP: Record<string, string> = { minimumAge: "maximumAge" };

/** Metric registry entries not yet answered, ranked by how many scholarships
 * they actually appear in - used to prioritize the "improve your matches"
 * follow-up questions (spec: question priority driven by database frequency). */
export function nextHighValueMetrics(profile: UserProfile, limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of METRIC_REGISTRY) {
    if (!METRIC_KEY_ANSWERED[m.key] || METRIC_KEY_ANSWERED[m.key](profile)) continue;
    const group = METRIC_FIELD_GROUP[m.key] ?? m.key;
    if (seen.has(group)) continue;
    seen.add(group);
    result.push(m.key);
    if (result.length >= limit) break;
  }
  return result;
}

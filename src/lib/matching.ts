// Deterministic profile-vs-scholarship matching. No network calls, no AI calls -
// every check here is a pure function of the structured data produced by
// scripts/build-data.ts and the user's local profile, so it works fully offline
// and produces the same answer every time (spec: "matching must work offline").
//
// The one rule every check obeys: a fact we don't have is "unknown", never a
// guess in either direction. "unknown" can only ever soften MATCH down to
// POSSIBLE_MATCH/INSUFFICIENT_INFORMATION - it can never produce NOT_ELIGIBLE.
// Only a requirement that is concretely known AND concretely violated does that.
import { extractMinYearsFromText } from "./normalize";
import type {
  CriterionCheck,
  DegreeLevel,
  MatchResult,
  MatchStatus,
  NumericRequirement,
  RegionKey,
  ScholarshipRecord,
  UserProfile,
  WithWithoutAll,
} from "./types";

type CheckResult = CriterionCheck["result"];

const LEVEL_TIER_ALIASES: Record<DegreeLevel, string[]> = {
  S1: ["S1"],
  S2: ["S2", "MASTER"],
  S3: ["S3", "DOKTOR", "DOCTOR", "PHD"],
  D3: ["D3"],
  D4: ["D4"],
  NonDegree: ["NON DEGREE", "NON-DEGREE", "NONDEGREE"],
};

/** If exactly one tier in a "S2: 35 / S3: 40"-style requirement corresponds to
 * the user's chosen target level(s), returns its value. Returns undefined
 * (unknown, not a guess) when zero or more than one tier could apply. */
function resolveTierValue(tiers: { label: string; value: number }[], targetLevels: DegreeLevel[]): number | undefined {
  const candidates = tiers.filter((t) =>
    targetLevels.some((lvl) => LEVEL_TIER_ALIASES[lvl].some((alias) => t.label.toUpperCase().includes(alias))),
  );
  return candidates.length === 1 ? candidates[0].value : undefined;
}

function evaluateNumeric(
  req: NumericRequirement,
  profileValue: number | undefined,
  comparator: "max" | "min",
  targetLevels: DegreeLevel[],
): CheckResult {
  switch (req.kind) {
    case "absent":
      return "unknown";
    case "not_required":
      return "pass";
    case "unparsed":
      return "unknown";
    case "value": {
      if (profileValue === undefined) return "unknown";
      const ok = comparator === "max" ? profileValue <= req.value : profileValue >= req.value;
      return ok ? "pass" : "fail";
    }
    case "tiered": {
      const resolved = resolveTierValue(req.tiers, targetLevels);
      if (resolved === undefined) return "unknown";
      if (profileValue === undefined) return "unknown";
      const ok = comparator === "max" ? profileValue <= resolved : profileValue >= resolved;
      return ok ? "pass" : "fail";
    }
  }
}

function checkLevel(profile: UserProfile, record: ScholarshipRecord): CriterionCheck {
  const wanted = profile.education.targetLevels;
  if (wanted.length === 0) {
    return { key: "level", label: "Jenjang studi", result: "unknown", detail: "Kamu belum pilih jenjang target." };
  }
  if (record.levels.length === 0) {
    return { key: "level", label: "Jenjang studi", result: "unknown", detail: `Jenjang tidak jelas di database (raw: "${record.raw.level}").` };
  }
  const intersects = record.levels.some((l) => wanted.includes(l));
  return {
    key: "level",
    label: "Jenjang studi",
    result: intersects ? "pass" : "fail",
    detail: intersects
      ? `Beasiswa ini untuk ${record.levels.join("/")}, sesuai targetmu.`
      : `Beasiswa ini untuk ${record.levels.join("/")}, bukan ${wanted.join("/")}.`,
  };
}

function checkGender(profile: UserProfile, record: ScholarshipRecord): CriterionCheck {
  const g = record.eligibility.gender;
  if (g.kind === "absent" || g.kind === "no_restriction") {
    return { key: "gender", label: "Gender", result: "pass", detail: "Tidak ada batasan gender." };
  }
  if (g.kind === "unparsed") {
    return { key: "gender", label: "Gender", result: "unknown", detail: `Syarat gender tidak jelas (raw: "${g.raw}").` };
  }
  // women_only
  if (!profile.personal.gender || profile.personal.gender === "prefer_not_say") {
    return { key: "gender", label: "Gender", result: "unknown", detail: "Beasiswa ini khusus perempuan, kamu belum kasih tau gender kamu." };
  }
  const ok = profile.personal.gender === "perempuan";
  return { key: "gender", label: "Gender", result: ok ? "pass" : "fail", detail: "Beasiswa ini khusus perempuan." };
}

function checkGraduationStatus(profile: UserProfile, record: ScholarshipRecord): CriterionCheck {
  const req = record.eligibility.graduatedStatus;
  const label = "Status kelulusan";
  if (!req.present) return { key: "graduatedStatus", label, result: "pass", detail: "Tidak ada syarat status kelulusan." };
  if (!profile.education.graduationStatus) {
    return { key: "graduatedStatus", label, result: "unknown", detail: `Butuh status: "${req.raw}", kamu belum isi status kelulusan.` };
  }
  const raw = req.raw;
  // SKL = "Surat Keterangan Lulus" (Indonesian pre-diploma completion letter,
  // i.e. coursework finished but the formal degree certificate isn't out yet)
  // - distinct from "Lulus" which implies the diploma itself is already in hand.
  const hasSKL = /\bskl\b/i.test(raw);
  const hasLulus = /lulus/i.test(raw);
  const status = profile.education.graduationStatus;
  if (hasSKL && hasLulus) return { key: "graduatedStatus", label, result: "pass", detail: `Menerima ${raw}.` };
  if (hasSKL && !hasLulus) {
    const ok = status !== "still_studying";
    return { key: "graduatedStatus", label, result: ok ? "pass" : "fail", detail: `Butuh SKL (minimal). Syarat: "${raw}".` };
  }
  if (hasLulus && !hasSKL) {
    if (status === "graduated_with_diploma") return { key: "graduatedStatus", label, result: "pass", detail: `Butuh sudah lulus penuh. Syarat: "${raw}".` };
    if (status === "still_studying" || status === "final_year") {
      return { key: "graduatedStatus", label, result: "fail", detail: `Butuh sudah lulus penuh (bukan SKL). Syarat: "${raw}".` };
    }
    return { key: "graduatedStatus", label, result: "unknown", detail: `Butuh sudah lulus penuh, statusmu (SKL) belum pasti diterima. Syarat: "${raw}".` };
  }
  return { key: "graduatedStatus", label, result: "unknown", detail: `Syarat status kelulusan tidak jelas: "${raw}".` };
}

function checkWorkExperience(profile: UserProfile, record: ScholarshipRecord): CriterionCheck {
  const req = record.eligibility.workExperience;
  const label = "Pengalaman kerja";
  if (!req.present) return { key: "workExperience", label, result: "pass", detail: "Tidak ada syarat pengalaman kerja." };
  const minYears = extractMinYearsFromText(req.raw);
  if (minYears === null) {
    return { key: "workExperience", label, result: "unknown", detail: `Syarat: "${req.raw}" - tidak bisa dibaca sebagai angka tahun otomatis.` };
  }
  if (profile.experience.workExperienceYears === undefined) {
    return { key: "workExperience", label, result: "unknown", detail: `Butuh min. ${minYears} tahun pengalaman, kamu belum isi datanya.` };
  }
  const ok = profile.experience.workExperienceYears >= minYears;
  return { key: "workExperience", label, result: ok ? "pass" : "fail", detail: `Butuh min. ${minYears} tahun pengalaman kerja.` };
}

function checkBackgroundStudy(profile: UserProfile, record: ScholarshipRecord): CriterionCheck {
  const req = record.eligibility.backgroundStudy;
  const label = "Bidang studi";
  const rawLower = req.raw.toLowerCase();
  if (!req.present || rawLower === "all" || rawLower.startsWith("all ") || rawLower.includes("all major")) {
    return { key: "backgroundStudy", label, result: "pass", detail: "Semua bidang studi diterima." };
  }
  const field = profile.education.fieldOfStudy?.trim().toLowerCase();
  const category = profile.education.fieldCategory;
  if (category === "stem" && /\bstem\b/i.test(req.raw)) {
    return { key: "backgroundStudy", label, result: "pass", detail: `Cocok dengan STEM. Syarat: "${req.raw}".` };
  }
  if (field && rawLower.includes(field)) {
    return { key: "backgroundStudy", label, result: "pass", detail: `Bidangmu disebut di syarat: "${req.raw}".` };
  }
  // Free text is too varied to safely say NOT_ELIGIBLE from a keyword miss -
  // a real match ("Computer Science" vs "Engineering, science, management")
  // can easily not share a literal substring. Under-claim instead of reject.
  return { key: "backgroundStudy", label, result: "unknown", detail: `Syarat bidang studi: "${req.raw}" - cek manual apakah bidangmu termasuk.` };
}

function numericCheck(
  key: string,
  label: string,
  req: NumericRequirement,
  profileValue: number | undefined,
  comparator: "max" | "min",
  targetLevels: DegreeLevel[],
  unitLabel: string,
): CriterionCheck {
  const result = evaluateNumeric(req, profileValue, comparator, targetLevels);
  const reqDescription =
    req.kind === "value"
      ? `${comparator === "max" ? "maks." : "min."} ${req.value}${unitLabel}`
      : req.kind === "tiered"
        ? req.tiers.map((t) => `${t.label}: ${t.value}${unitLabel}`).join(", ")
        : req.kind === "not_required"
          ? "tidak ada syarat"
          : req.kind === "absent"
            ? "tidak tercantum di database"
            : `"${req.raw}"`;
  let detail: string;
  if (result === "unknown" && profileValue === undefined && (req.kind === "value" || req.kind === "tiered")) {
    detail = `Syarat ${label.toLowerCase()}: ${reqDescription}, kamu belum isi datamu.`;
  } else {
    detail = `Syarat ${label.toLowerCase()}: ${reqDescription}.`;
  }
  return { key, label, result, detail };
}

export function matchScholarship(profile: UserProfile, record: ScholarshipRecord): MatchResult {
  const targetLevels = profile.education.targetLevels;
  const checks: CriterionCheck[] = [
    checkLevel(profile, record),
    checkGender(profile, record),
    numericCheck("maximumAge", "Usia maksimal", record.eligibility.maximumAge, profile.personal.age, "max", targetLevels, " tahun"),
    numericCheck("minimumAge", "Usia minimal", record.eligibility.minimumAge, profile.personal.age, "min", targetLevels, " tahun"),
    numericCheck("minGpa", "GPA minimal", record.eligibility.minGpa, profile.education.gpa, "min", targetLevels, ""),
    numericCheck("ielts", "IELTS", record.eligibility.ielts, profile.language.ielts, "min", targetLevels, ""),
    numericCheck("toeflItp", "TOEFL iTP", record.eligibility.toeflItp, profile.language.toeflItp, "min", targetLevels, ""),
    checkGraduationStatus(profile, record),
    checkWorkExperience(profile, record),
    checkBackgroundStudy(profile, record),
  ];

  const fails = checks.filter((c) => c.result === "fail").length;
  const passes = checks.filter((c) => c.result === "pass").length;
  const unknowns = checks.filter((c) => c.result === "unknown").length;

  let status: MatchStatus;
  if (fails > 0) status = "NOT_ELIGIBLE";
  // Two independent passing signals with nothing unresolved is treated as a
  // confident MATCH; a single passing signal (often just "level") with gaps
  // elsewhere is downgraded to POSSIBLE_MATCH rather than overclaiming.
  else if (passes >= 2 && unknowns === 0) status = "MATCH";
  else if (passes >= 1) status = "POSSIBLE_MATCH";
  else status = "INSUFFICIENT_INFORMATION";

  return { scholarshipId: record.id, status, checks };
}

export function matchAll(profile: UserProfile, records: ScholarshipRecord[]): Map<number, MatchResult> {
  const map = new Map<number, MatchResult>();
  for (const record of records) map.set(record.id, matchScholarship(profile, record));
  return map;
}

// Buckets the best-effort derived country tag into the same four regions the
// original app's "region to skip" question offered. Anything not listed here
// (Australia, NZ, Canada, Indonesia, Turkey, ...) is the original's "Lainnya"
// bucket, which was never offered as a skip option - so it's never excluded
// by this filter, matching the original behavior exactly.
const REGION_BUCKET: Record<string, RegionKey> = {
  "United Kingdom": "uk",
  "United States": "us",
  Japan: "asia",
  "South Korea": "asia",
  China: "asia",
  Singapore: "asia",
  Taiwan: "asia",
  "Hong Kong": "asia",
  India: "asia",
  Germany: "europe",
  France: "europe",
  Netherlands: "europe",
  Switzerland: "europe",
  Austria: "europe",
  Belgium: "europe",
  Sweden: "europe",
  Norway: "europe",
  Finland: "europe",
  Italy: "europe",
  Spain: "europe",
  Hungary: "europe",
  Romania: "europe",
  "Czech Republic": "europe",
  Poland: "europe",
  Denmark: "europe",
  Ireland: "europe",
  "European Union": "europe",
  Latvia: "europe",
  Lithuania: "europe",
  Estonia: "europe",
  Portugal: "europe",
  Greece: "europe",
  Slovenia: "europe",
  Slovakia: "europe",
  Croatia: "europe",
  Bulgaria: "europe",
  Iceland: "europe",
  Luxembourg: "europe",
  Malta: "europe",
  Cyprus: "europe",
  Serbia: "europe",
  Thailand: "asia",
  Malaysia: "asia",
  Brunei: "asia",
  Vietnam: "asia",
  Philippines: "asia",
};

function matchesWithWithoutAll(pref: WithWithoutAll[], hasIt: boolean): boolean {
  if (pref.length === 0 || pref.includes("all")) return true;
  const wantWith = pref.includes("with");
  const wantWithout = pref.includes("without");
  if (wantWith && !wantWithout && !hasIt) return false;
  if (wantWithout && !wantWith && hasIt) return false;
  return true;
}

/** Soft, user-adjustable filters (funding type, region, IELTS/essay/interview
 * preference, destination) - distinct from eligibility matching: a mismatch
 * here means "not what you're looking for", not "you're ineligible", so it
 * never produces a NOT_ELIGIBLE status. Mirrors the original app's onboarding
 * filter questions (gender is handled as an eligibility check instead, since
 * "women only" is a real eligibility restriction rather than a preference). */
export function filterByPreferences(records: ScholarshipRecord[], profile: UserProfile): ScholarshipRecord[] {
  const funding = profile.preferences.funding;
  const excludedRegions = new Set(profile.preferences.excludedRegions);
  const excludedCountryTags = new Set(profile.preferences.excludedCountryTags);

  return records.filter((r) => {
    if (funding.length > 0 && !funding.includes("all")) {
      const wantsFull = funding.includes("full");
      const wantsPartial = funding.includes("partial");
      const wantsNone = funding.includes("none");
      const okFull = wantsFull && (r.benefits.fundingType === "full" || r.benefits.fundingType === "both");
      const okPartial = wantsPartial && (r.benefits.fundingType === "partial" || r.benefits.fundingType === "both");
      const okNone = wantsNone && r.benefits.fundingType === "unknown";
      if (!okFull && !okPartial && !okNone) return false;
    }

    if (r.countryTag) {
      if (excludedCountryTags.has(r.countryTag.label)) return false;
      const bucket = REGION_BUCKET[r.countryTag.label];
      if (bucket && excludedRegions.has(bucket)) return false;
    }

    const hasIelts = ["value", "tiered", "unparsed"].includes(r.eligibility.ielts.kind);
    if (!matchesWithWithoutAll(profile.preferences.ieltsPreference, hasIelts)) return false;

    const hasEssay = r.materials.essayPersonalStatement.kind === "yes";
    if (!matchesWithWithoutAll(profile.preferences.essayPreference, hasEssay)) return false;

    const hasInterview = r.materials.interview.kind === "yes";
    if (!matchesWithWithoutAll(profile.preferences.interviewPreference, hasInterview)) return false;

    return true;
  });
}

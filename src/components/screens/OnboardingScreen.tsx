"use client";

import { BASIC_QUEST_STEPS } from "@/lib/onboardingSteps";
import type { DegreeLevel, RegionKey, UserProfile } from "@/lib/types";

// funding/ieltsPreference/essayPreference/interviewPreference all follow the
// original app's "pick some, or pick the isAll chip to clear the filter"
// pattern - same toggle rule, just a different profile.preferences field.
const ALL_CLEARING_PREF_FIELDS = ["funding", "ieltsPreference", "essayPreference", "interviewPreference"] as const;
type AllClearingPrefField = (typeof ALL_CLEARING_PREF_FIELDS)[number];

function isAllClearingPrefField(key: string): key is AllClearingPrefField {
  return (ALL_CLEARING_PREF_FIELDS as readonly string[]).includes(key);
}

function isChipOn(profile: UserProfile, stepKey: string, value: string): boolean {
  switch (stepKey) {
    case "gender":
      return profile.personal.gender === value;
    case "targetLevels": {
      const levels = profile.education.targetLevels;
      if (value === "D3D4") return levels.includes("D3") && levels.includes("D4");
      return levels.includes(value as DegreeLevel);
    }
    case "fieldCategory":
      return profile.education.fieldCategory === value;
    case "region":
      return profile.preferences.excludedRegions.includes(value as RegionKey);
    case "graduationStatus":
      return profile.education.graduationStatus === value;
    default:
      if (isAllClearingPrefField(stepKey)) return (profile.preferences[stepKey] as string[]).includes(value);
      return false;
  }
}

function toggleChip(profile: UserProfile, stepKey: string, value: string): UserProfile {
  switch (stepKey) {
    case "gender":
      return { ...profile, personal: { ...profile.personal, gender: value as UserProfile["personal"]["gender"] } };
    case "targetLevels": {
      const tokens: DegreeLevel[] = value === "D3D4" ? ["D3", "D4"] : [value as DegreeLevel];
      const current = new Set(profile.education.targetLevels);
      const allPresent = tokens.every((t) => current.has(t));
      if (allPresent) tokens.forEach((t) => current.delete(t));
      else tokens.forEach((t) => current.add(t));
      return { ...profile, education: { ...profile.education, targetLevels: [...current] } };
    }
    case "fieldCategory":
      return { ...profile, education: { ...profile.education, fieldCategory: value as UserProfile["education"]["fieldCategory"] } };
    case "region": {
      const current = profile.preferences.excludedRegions;
      const next = current.includes(value as RegionKey) ? current.filter((v) => v !== value) : [...current, value as RegionKey];
      return { ...profile, preferences: { ...profile.preferences, excludedRegions: next } };
    }
    case "graduationStatus":
      return { ...profile, education: { ...profile.education, graduationStatus: value as UserProfile["education"]["graduationStatus"] } };
    default:
      if (isAllClearingPrefField(stepKey)) {
        if (value === "all") return { ...profile, preferences: { ...profile.preferences, [stepKey]: ["all"] } };
        let current = (profile.preferences[stepKey] as string[]).filter((v) => v !== "all");
        current = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
        if (current.length === 0) current = ["all"];
        return { ...profile, preferences: { ...profile.preferences, [stepKey]: current } };
      }
      return profile;
  }
}

export function OnboardingScreen({
  name,
  stepIndex,
  profile,
  onChange,
  onNext,
  onBack,
}: {
  name: string;
  stepIndex: number;
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const step = BASIC_QUEST_STEPS[stepIndex];
  const total = BASIC_QUEST_STEPS.length;

  return (
    <section className="screen">
      <div className="wizard-wrap">
        <div>
          <div className="progress-label">
            <span>
              Level {stepIndex + 1} dari {total}
            </span>
            <span>{name}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.round((stepIndex / total) * 100)}%` }} />
          </div>
        </div>

        <div className="q-card">
          <div className="q-title">{step.title}</div>
          {step.sub && <div className="q-sub">{step.sub}</div>}

          {step.type === "number" ? (
            <div className="q-field">
              <input
                type="number"
                step="any"
                placeholder="cth. 6.5"
                value={profile.language.ielts ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  onChange({ ...profile, language: { ...profile.language, ielts: raw === "" ? undefined : Number(raw) } });
                }}
              />
              <div className="q-skip-note">Kosongin aja kalau belum ada, tinggal klik Lanjut.</div>
            </div>
          ) : (
            <div className={"chip-grid" + (step.type === "single" ? " single" : "")}>
              {step.options?.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={"chip" + (isChipOn(profile, step.key, opt.value) ? " is-on" : "")}
                  onClick={() => onChange(toggleChip(profile, step.key, opt.value))}
                >
                  <span className="chip-icon">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {step.key === "fieldCategory" && (
            <div className="q-field">
              <label htmlFor="field-of-study">Bidang spesifik (opsional)</label>
              <input
                id="field-of-study"
                type="text"
                placeholder="cth. Ilmu Komputer"
                value={profile.education.fieldOfStudy ?? ""}
                onChange={(e) => onChange({ ...profile, education: { ...profile.education, fieldOfStudy: e.target.value } })}
              />
            </div>
          )}
        </div>

        <div className="wizard-nav">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            ← Kembali
          </button>
          <span className="spacer" />
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {stepIndex === total - 1 ? "Lihat Beasiswa Kamu 🎉" : "Lanjut →"}
          </button>
        </div>
      </div>
    </section>
  );
}

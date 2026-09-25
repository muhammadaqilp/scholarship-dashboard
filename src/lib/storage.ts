import { defaultProfile } from "./profile";
import type { UserProfile, VerificationRecord } from "./types";

const STORAGE_KEY = "sq_state_v2";

export interface PersistedState {
  name: string;
  profile: UserProfile;
  favorites: number[];
  verifications: Record<number, VerificationRecord>;
}

/** A one-level-shallow `{ ...defaults, ...saved }` would silently drop any
 * field added to a nested object (e.g. UserProfile.preferences) after a user
 * already had state saved - the old, smaller `preferences` object would
 * replace the new default wholesale instead of filling gaps in it. Merge one
 * level deeper so old saves gain new fields' defaults without losing answers
 * to fields that already existed. */
function mergeProfile(defaults: UserProfile, saved: Partial<UserProfile> | undefined): UserProfile {
  if (!saved) return defaults;
  return {
    personal: { ...defaults.personal, ...saved.personal },
    education: { ...defaults.education, ...saved.education },
    language: { ...defaults.language, ...saved.language },
    experience: { ...defaults.experience, ...saved.experience },
    preferences: { ...defaults.preferences, ...saved.preferences },
  };
}

export function loadPersistedState(): PersistedState {
  const fallback: PersistedState = { name: "", profile: defaultProfile(), favorites: [], verifications: {} };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      profile: mergeProfile(defaultProfile(), parsed.profile),
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      verifications: parsed.verifications && typeof parsed.verifications === "object" ? parsed.verifications : {},
    };
  } catch {
    return fallback;
  }
}

export function savePersistedState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, quota) - state just won't persist
  }
}

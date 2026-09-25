// Static access-code gate. One configured code (SCHOLARSHIP_QUEST_ACCESS_CODE,
// see scripts/build-access-code.ts), no accounts, no per-user licenses. This
// is intentionally a client-side check, not real authentication - see the
// module doc on AccessGate.tsx for the honest security tradeoff. The one
// thing it does properly: the plaintext code is never sent to the browser.
// Only its SHA-256 hash is baked into the build, and both build-time hashing
// and runtime verification share this exact normalize+hash logic so they can
// never drift apart.

const UNLOCK_STORAGE_KEY = "scholarshipQuestUnlocked";

/** Trim + collapse internal whitespace + uppercase, so "sq-2026 abcd" and
 * "SQ-2026-ABCD" (typo'd space instead of dash aside) are forgiving to type
 * but still distinct codes hash differently - no fuzzy dash/space swapping. */
export function normalizeAccessCode(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(UNLOCK_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function unlock(): void {
  if (typeof window === "undefined") return;
  try {
    // Only the unlocked flag is persisted - never the code itself.
    window.localStorage.setItem(UNLOCK_STORAGE_KEY, "true");
  } catch {
    // storage unavailable (private mode, quota) - unlock just won't persist
  }
}

export function lock(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(UNLOCK_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export type AccessCheckResult = "empty" | "invalid" | "valid";

export async function checkAccessCode(input: string, expectedHash: string): Promise<AccessCheckResult> {
  const normalized = normalizeAccessCode(input);
  if (!normalized) return "empty";
  const hash = await sha256Hex(normalized);
  return hash === expectedHash ? "valid" : "invalid";
}

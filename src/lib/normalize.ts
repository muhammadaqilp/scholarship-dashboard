// Turns the messy free-text bullet values from the Excel "Complete Eligibility
// Requirements" / "Complete Benefits" / "Materials Required" columns into the
// structured types in lib/types.ts. The one rule every function here obeys:
// if a value can't be confidently parsed, return `unparsed`/`absent`, never a
// guessed number or boolean. The matching engine treats those as "unknown",
// not as "no requirement".
import type { BooleanRequirement, GenderRequirement, NumericRequirement, TextRequirement } from "./types";

const NO_REQ_PATTERN = /^\s*(no+\s*req\.?|n\/?a|tidak\s*ada|none|-|not\s*required)\s*$/i;

/** Splits "• Key: value\n• Key2: value2" bullet text into a key→value map. */
export function extractBulletKeyValues(text: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!text) return map;
  const parts = text.split(/(?:^|\n)\s*•\s*/).map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const m = part.match(/^([^:]{1,60}):\s*([\s\S]*)$/);
    if (m) {
      const key = m[1].trim();
      const value = m[2].trim();
      // last bullet in a block sometimes swallows trailing bullets without their
      // own "Key:" prefix (free-form notes) - keep first occurrence per key
      if (!map.has(key)) map.set(key, value);
    }
  }
  return map;
}

function isNoReq(raw: string): boolean {
  return NO_REQ_PATTERN.test(raw.trim());
}

const TIER_LABEL = /\b(S1|S2|S3|D3|D4|Master|Doktor|PhD|DN|LN|Umum|PNS|Fungsional|TNI\/?POLRI|TNI|POLRI)\b/i;

/** Parses a value that may be a plain number, a set of "Label: number" tiers
 * separated by newlines/commas, or free text we can't confidently reduce to
 * a number. */
export function parseNumericRequirement(raw: string | undefined): NumericRequirement {
  if (raw === undefined || raw.trim() === "") return { kind: "absent" };
  const trimmed = raw.trim();
  if (isNoReq(trimmed)) return { kind: "not_required", raw: trimmed };

  const singleMatch = trimmed.match(/^[^\d]*(\d+(?:[.,]\d+)?)\s*(?:tahun|years?|thn)?\.?\s*$/i);
  if (singleMatch) {
    return { kind: "value", value: Number(singleMatch[1].replace(",", ".")), raw: trimmed };
  }

  const tierLines = trimmed.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  const tiers: { label: string; value: number }[] = [];
  for (const line of tierLines) {
    const m = line.match(/^([^:]{1,30}):\s*(\d+(?:[.,]\d+)?)/);
    if (m && TIER_LABEL.test(m[1])) {
      tiers.push({ label: m[1].trim(), value: Number(m[2].replace(",", ".")) });
    }
  }
  if (tiers.length) return { kind: "tiered", tiers, raw: trimmed };

  return { kind: "unparsed", raw: trimmed };
}

export function parseBooleanRequirement(raw: string | undefined): BooleanRequirement {
  if (raw === undefined || raw.trim() === "") return { kind: "absent" };
  const trimmed = raw.trim();
  if (/^(yes|ya|wajib)\b/i.test(trimmed)) return { kind: "yes", raw: trimmed };
  if (/^(no|tidak|nggak)\b/i.test(trimmed) || isNoReq(trimmed)) return { kind: "no", raw: trimmed };
  return { kind: "unparsed", raw: trimmed };
}

export function parseGenderRequirement(raw: string | undefined): GenderRequirement {
  if (raw === undefined || raw.trim() === "") return { kind: "absent" };
  const trimmed = raw.trim();
  if (/perempuan/i.test(trimmed)) return { kind: "women_only", raw: trimmed };
  if (/^(all|semua)\b/i.test(trimmed) || isNoReq(trimmed)) return { kind: "no_restriction", raw: trimmed };
  return { kind: "unparsed", raw: trimmed };
}

export function parseTextRequirement(raw: string | undefined): TextRequirement {
  const trimmed = (raw ?? "").trim();
  return { raw: trimmed, present: trimmed.length > 0 && !isNoReq(trimmed) };
}

export function parseFundingType(raw: string | undefined): "full" | "partial" | "both" | "unknown" {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (!trimmed) return "unknown";
  if (trimmed.includes("full") && trimmed.includes("partial")) return "both";
  if (trimmed.includes("both")) return "both";
  if (trimmed.includes("full")) return "full";
  if (trimmed.includes("partial")) return "partial";
  return "unknown";
}

/** Parses "S1/S2/S3", "D3/S1 (exchange)", "S2/S2/S3" etc. into a clean,
 * deduplicated list of degree-level tokens actually present in the source. */
export function parseDegreeLevels(raw: string): ("D3" | "D4" | "S1" | "S2" | "S3" | "NonDegree")[] {
  const tokens = new Set<"D3" | "D4" | "S1" | "S2" | "S3" | "NonDegree">();
  for (const m of raw.matchAll(/D3|D4|S1|S2|S3/gi)) {
    tokens.add(m[0].toUpperCase() as "D3" | "D4" | "S1" | "S2" | "S3");
  }
  if (tokens.size === 0 && /short\s*course|non[\s-]*degree|non\s*gelar/i.test(raw)) {
    tokens.add("NonDegree");
  }
  return [...tokens];
}

/** Best-effort "N years/tahun" extraction from free-text work-experience
 * requirements, used only at match time (never persisted) - too many rows
 * mix narrative text with a number to normalize confidently at build time. */
export function extractMinYearsFromText(raw: string): number | null {
  const m = raw.match(/(\d+)\s*(?:tahun|years?|thn)\b/i);
  return m ? Number(m[1]) : null;
}

const COUNTRY_TLD_MAP: Record<string, string> = {
  jp: "Japan", de: "Germany", uk: "United Kingdom", au: "Australia", id: "Indonesia",
  kr: "South Korea", cn: "China", nl: "Netherlands", fr: "France", ca: "Canada",
  sg: "Singapore", nz: "New Zealand", ch: "Switzerland", at: "Austria", be: "Belgium",
  se: "Sweden", no: "Norway", fi: "Finland", it: "Italy", es: "Spain", us: "United States",
  hu: "Hungary", tr: "Turkey", ro: "Romania", cz: "Czech Republic", pl: "Poland",
  dk: "Denmark", ie: "Ireland", tw: "Taiwan", hk: "Hong Kong", in: "India",
  lv: "Latvia", lt: "Lithuania", ee: "Estonia", pt: "Portugal", gr: "Greece",
  si: "Slovenia", sk: "Slovakia", hr: "Croatia", bg: "Bulgaria", is: "Iceland",
  lu: "Luxembourg", mt: "Malta", cy: "Cyprus", rs: "Serbia", ru: "Russia",
  th: "Thailand", my: "Malaysia", bn: "Brunei", vn: "Vietnam", ph: "Philippines",
  qa: "Qatar", ae: "United Arab Emirates", sa: "Saudi Arabia",
};

const COUNTRY_NAME_KEYWORDS: [RegExp, string][] = [
  [/chevening/i, "United Kingdom"],
  [/fulbright/i, "United States"],
  [/\bdaad\b/i, "Germany"],
  [/\bmext\b/i, "Japan"],
  [/erasmus/i, "European Union"],
  [/australia\s*awards?/i, "Australia"],
  [/endeavour/i, "Australia"],
  [/eiffel/i, "France"],
  [/chinese\s*government\s*scholarship|\bcsc\b/i, "China"],
  [/stipendium\s*hungaricum/i, "Hungary"],
  [/turkiye\s*burslari/i, "Turkey"],
  [/\bgks\b|korean\s*government\s*scholarship/i, "South Korea"],
  [/swiss\s*government/i, "Switzerland"],
  [/\blpdp\b/i, "Indonesia"],
];

/** Best-effort, clearly-labeled destination tag derived from the resource
 * URL's country-code TLD or a small curated map of well-known program names.
 * Never used as a hard eligibility filter - source data has no dedicated
 * country column, so this is a soft UI filter only. */
export function deriveCountryTag(
  scholarshipName: string,
  resourceUrl: string,
): { label: string; confidence: "derived_from_url" | "derived_from_name"; sourceHint: string } | null {
  for (const [pattern, country] of COUNTRY_NAME_KEYWORDS) {
    if (pattern.test(scholarshipName)) {
      return { label: country, confidence: "derived_from_name", sourceHint: scholarshipName };
    }
  }
  try {
    const host = new URL(resourceUrl).hostname;
    const tldMatch = host.match(/\.([a-z]{2})$/i);
    if (tldMatch) {
      const country = COUNTRY_TLD_MAP[tldMatch[1].toLowerCase()];
      if (country) return { label: country, confidence: "derived_from_url", sourceHint: host };
    }
  } catch {
    // resourceUrl missing or malformed - no tag, not a guess
  }
  return null;
}

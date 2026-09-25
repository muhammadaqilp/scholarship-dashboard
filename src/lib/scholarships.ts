// Bundled at build time via a plain JSON import - Next.js inlines this into the
// client bundle, so scholarship data is available with zero network requests
// at runtime, satisfying the offline-first requirement.
import scholarshipsData from "../../data/generated/scholarships.json";
import metricsData from "../../data/generated/metrics.json";
import buildInfo from "../../data/generated/build-info.json";
import type { MetricDefinition, ScholarshipRecord } from "./types";

export const SCHOLARSHIPS = scholarshipsData as ScholarshipRecord[];
export const METRIC_REGISTRY = metricsData as MetricDefinition[];
export const BUILD_INFO = buildInfo as { generatedAt: string; recordCount: number; sourceFile: string };

export function getScholarshipById(id: number): ScholarshipRecord | undefined {
  return SCHOLARSHIPS.find((s) => s.id === id);
}

export function getAllCountryTags(): string[] {
  const set = new Set<string>();
  for (const s of SCHOLARSHIPS) if (s.countryTag) set.add(s.countryTag.label);
  return [...set].sort();
}

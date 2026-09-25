import type { MatchStatus, SourceType } from "./types";

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  MATCH: "Cocok",
  POSSIBLE_MATCH: "Kemungkinan cocok",
  NOT_ELIGIBLE: "Belum eligible",
  INSUFFICIENT_INFORMATION: "Perlu info lebih",
};

export const MATCH_STATUS_CLASS: Record<MatchStatus, string> = {
  MATCH: "badge-match",
  POSSIBLE_MATCH: "badge-possible",
  NOT_ELIGIBLE: "badge-ineligible",
  INSUFFICIENT_INFORMATION: "badge-insufficient",
};

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  DATABASE: "DATABASE",
  WEB_VERIFIED: "VERIFIED ONLINE",
  USER_APPROVED_SOURCE: "USER APPROVED",
};

export const SOURCE_TYPE_CLASS: Record<SourceType, string> = {
  DATABASE: "badge-source-database",
  WEB_VERIFIED: "badge-source-verified",
  USER_APPROVED_SOURCE: "badge-source-user-approved",
};

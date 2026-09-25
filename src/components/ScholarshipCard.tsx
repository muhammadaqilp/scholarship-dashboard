"use client";

import { useState } from "react";
import { MATCH_STATUS_CLASS, MATCH_STATUS_LABEL } from "@/lib/matchLabels";
import type { MatchResult, ScholarshipRecord } from "@/lib/types";

function booleanLabel(kind: string): boolean {
  return kind === "yes";
}

export function ScholarshipCard({
  scholarship,
  matchResult,
  isFavorite,
  onToggleFavorite,
  onOpenDetail,
  animationIndex,
}: {
  scholarship: ScholarshipRecord;
  matchResult: MatchResult;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenDetail: () => void;
  animationIndex: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const req = scholarship.raw.requirement;
  const reqPreview = req.length > 150 ? req.slice(0, 150) + "…" : req;
  const relevantChecks = matchResult.checks.filter((c) => c.result !== "not_applicable");

  return (
    <div className="card" style={{ animationDelay: `${Math.min(animationIndex * 25, 400)}ms` }}>
      <div className="card-top">
        <div className="card-name">{scholarship.raw.scholarshipName}</div>
        <button
          type="button"
          className={"save-btn" + (isFavorite ? " is-saved" : "")}
          title="Simpan ke Daftar Impian"
          onClick={onToggleFavorite}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="badge-row">
        <span className={"badge " + MATCH_STATUS_CLASS[matchResult.status]}>{MATCH_STATUS_LABEL[matchResult.status]}</span>
        {scholarship.levels.length > 0 && <span className="badge badge-region">{scholarship.levels.join("/")}</span>}
        <span className={"badge " + (scholarship.benefits.fundingType === "partial" ? "badge-partial" : "badge-full")}>
          {scholarship.benefits.fundingType === "full"
            ? "Full Funded"
            : scholarship.benefits.fundingType === "partial"
              ? "Partial"
              : scholarship.benefits.fundingType === "both"
                ? "Full/Partial"
                : "Cek detail"}
        </span>
        {scholarship.countryTag && <span className="badge badge-region">🌍 {scholarship.countryTag.label}</span>}
        {scholarship.eligibility.gender.kind === "women_only" && <span className="badge badge-women">👩 Khusus Perempuan</span>}
      </div>

      <div className="card-req">{reqPreview}</div>

      <div className="icon-row">
        <span className={booleanLabel(scholarship.materials.englishTestScores.kind) ? "on" : ""}>
          {booleanLabel(scholarship.materials.englishTestScores.kind) ? "✓" : "–"} Tes Bahasa
        </span>
        <span className={booleanLabel(scholarship.materials.essayPersonalStatement.kind) ? "on" : ""}>
          {booleanLabel(scholarship.materials.essayPersonalStatement.kind) ? "✓" : "–"} Essay
        </span>
        <span className={booleanLabel(scholarship.materials.interview.kind) ? "on" : ""}>
          {booleanLabel(scholarship.materials.interview.kind) ? "✓" : "–"} Interview
        </span>
      </div>

      {expanded && (
        <div className="req-detail">
          <div className="check-list">
            {relevantChecks.map((c) => (
              <div key={c.key} className={c.result}>
                {c.result === "pass" ? "✓" : c.result === "fail" ? "✗" : "?"} <b>{c.label}:</b> {c.detail}
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="expand-btn" onClick={() => setExpanded((v) => !v)}>
        {expanded ? "Tutup alasan ▴" : "Kenapa cocok/belum? ▾"}
      </button>

      <div className="card-foot">
        <div className="deadline-tag">📅 {scholarship.raw.closeMonth || scholarship.raw.deadlineSource || "Cek website"}</div>
        <button type="button" className="link-out" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onOpenDetail}>
          Detail lengkap →
        </button>
      </div>
    </div>
  );
}

"use client";

import { MATCH_STATUS_CLASS, MATCH_STATUS_LABEL, SOURCE_TYPE_CLASS, SOURCE_TYPE_LABEL } from "@/lib/matchLabels";
import type { MatchResult, ScholarshipRecord, VerificationRecord } from "@/lib/types";

type BooleanMaterialKey = Exclude<keyof ScholarshipRecord["materials"], "otherMaterials">;

const MATERIAL_LABELS: [BooleanMaterialKey, string][] = [
  ["essayPersonalStatement", "Essay / Personal Statement"],
  ["studyPlan", "Study Plan"],
  ["letterOfAcceptance", "Letter of Acceptance"],
  ["letterOfRecommendation", "Letter of Recommendation"],
  ["transcriptGpa", "Transcript / GPA"],
  ["englishTestScores", "Skor Tes Bahasa Inggris"],
  ["interview", "Interview"],
  ["resumeCv", "Resume / CV"],
  ["financialRecords", "Financial Records"],
  ["governmentStatement", "Government Statement"],
  ["passportId", "Passport / ID"],
  ["motivationalLetter", "Motivational Letter"],
  ["researchProposal", "Research Proposal"],
];

export function DetailModal({
  scholarship,
  matchResult,
  verification,
  verifying,
  onVerify,
  onClose,
}: {
  scholarship: ScholarshipRecord;
  matchResult: MatchResult;
  verification: VerificationRecord | undefined;
  verifying: boolean;
  onVerify: () => void;
  onClose: () => void;
}) {
  const relevantChecks = matchResult.checks.filter((c) => c.result !== "not_applicable");
  const requiredMaterials = MATERIAL_LABELS.filter(([key]) => scholarship.materials[key].kind === "yes");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
          ✕
        </button>

        <div className="modal-section">
          <h4>Overview</h4>
          <div className="card-name" style={{ fontSize: 20 }}>
            {scholarship.raw.scholarshipName}
          </div>
          <div className="badge-row">
            <span className={"badge " + MATCH_STATUS_CLASS[matchResult.status]}>{MATCH_STATUS_LABEL[matchResult.status]}</span>
            {scholarship.levels.length > 0 && <span className="badge badge-region">{scholarship.levels.join("/")}</span>}
            {scholarship.countryTag && <span className="badge badge-region">🌍 {scholarship.countryTag.label}</span>}
            <span className={"badge " + SOURCE_TYPE_CLASS.DATABASE}>{SOURCE_TYPE_LABEL.DATABASE}</span>
          </div>
        </div>

        <div className="modal-section">
          <h4>Kenapa cocok / belum</h4>
          <div className="check-list">
            {relevantChecks.map((c) => (
              <div key={c.key} className={c.result}>
                {c.result === "pass" ? "✓" : c.result === "fail" ? "✗" : "?"} <b>{c.label}:</b> {c.detail}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <h4>Eligibility lengkap</h4>
          <p className="raw-text">{scholarship.raw.completeEligibilityRequirements || scholarship.raw.requirement || "Tidak tercantum di database."}</p>
        </div>

        <div className="modal-section">
          <h4>Benefit lengkap</h4>
          <p className="raw-text">{scholarship.raw.completeBenefits || scholarship.raw.benefit || "Tidak tercantum di database."}</p>
        </div>

        <div className="modal-section">
          <h4>Dokumen yang mungkin dibutuhkan</h4>
          {requiredMaterials.length > 0 ? (
            <p className="raw-text">{requiredMaterials.map(([, label]) => label).join(", ")}</p>
          ) : (
            <p className="raw-text">Tidak ada daftar dokumen spesifik di database.</p>
          )}
          {scholarship.materials.otherMaterials && <p className="raw-text">Lainnya: {scholarship.materials.otherMaterials}</p>}
        </div>

        <div className="modal-section">
          <h4>Timeline</h4>
          <p className="raw-text">
            Buka: {scholarship.raw.openMonth || "–"} ({scholarship.raw.openDateSource || "tanggal belum pasti"})
            <br />
            Deadline: {scholarship.raw.closeMonth || "–"} ({scholarship.raw.deadlineSource || "tanggal belum pasti"})
          </p>
        </div>

        <div className="modal-section">
          <h4>Sumber</h4>
          <div className="verify-row">
            <span>Data dari {scholarship.provenance.sourceReference} di database beasiswamu.</span>
          </div>
          <div className="verify-row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onVerify} disabled={verifying}>
              {verifying ? "Mengecek…" : "🔄 Verify Online"}
            </button>
            {verification && (
              <span>
                {verification.reachable ? "✓" : "⚠"} {verification.note} (dicek {new Date(verification.checkedAt).toLocaleString("id-ID")})
              </span>
            )}
          </div>
          {scholarship.raw.resourceUrl && (
            <a href={scholarship.raw.resourceUrl} target="_blank" rel="noopener noreferrer" className="link-out">
              Buka halaman resmi ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

#!/usr/bin/env node
// Build-time data pipeline: Excel ("Full Database" sheet) -> data/generated/*.json.
// This is the only place scholarship data enters the app. The runtime app never
// talks to a spreadsheet library or fetches this data remotely - it imports the
// generated JSON directly, so the offline app has the same data whether the
// build ran an hour ago or a year ago.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanupExtracted,
  extractXlsx,
  parseSharedStrings,
  parseSheetRows,
  parseWorkbookSheets,
  type SheetRow,
} from "./xlsx-xml";
import {
  deriveCountryTag,
  extractBulletKeyValues,
  parseBooleanRequirement,
  parseDegreeLevels,
  parseFundingType,
  parseGenderRequirement,
  parseNumericRequirement,
  parseTextRequirement,
} from "../src/lib/normalize";
import type { MetricDefinition, ScholarshipRecord } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE_XLSX = join(ROOT, "data", "source", "scholarship-calendar.xlsx");
const OUT_DIR = join(ROOT, "data", "generated");

const HEADER_MATCHERS: { field: string; test: (headerLower: string) => boolean }[] = [
  { field: "no", test: (h) => h === "#" },
  { field: "scholarshipName", test: (h) => h === "scholarship name" },
  { field: "level", test: (h) => h === "level" },
  { field: "openMonth", test: (h) => h === "open month" },
  { field: "closeMonth", test: (h) => h === "close month" },
  { field: "openDateSource", test: (h) => h.startsWith("open date") },
  { field: "deadlineSource", test: (h) => h.startsWith("deadline") },
  { field: "requirement", test: (h) => h === "requirement" },
  { field: "benefit", test: (h) => h === "benefit" },
  { field: "resourceUrl", test: (h) => h === "resource url" },
  { field: "completeEligibilityRequirements", test: (h) => h.includes("eligibility requirements") },
  { field: "completeBenefits", test: (h) => h.includes("complete benefits") },
  { field: "materialsRequired", test: (h) => h.includes("materials required") },
];

function findHeaderRow(rows: SheetRow[]): { row: SheetRow; colToField: Map<string, string> } {
  for (const row of rows) {
    const values = Object.values(row.cells).map((v) => v.trim().toLowerCase());
    if (values.includes("scholarship name")) {
      const colToField = new Map<string, string>();
      for (const [col, text] of Object.entries(row.cells)) {
        const headerLower = text.trim().toLowerCase();
        const match = HEADER_MATCHERS.find((m) => m.test(headerLower));
        if (match) colToField.set(col, match.field);
      }
      return { row, colToField };
    }
  }
  throw new Error('Could not find header row (looking for a "Scholarship Name" cell) in Full Database sheet');
}

function buildScholarshipRecord(id: number, fields: Record<string, string>): ScholarshipRecord {
  const raw = {
    no: fields.no ?? "",
    scholarshipName: fields.scholarshipName ?? "",
    level: fields.level ?? "",
    openMonth: fields.openMonth ?? "",
    closeMonth: fields.closeMonth ?? "",
    openDateSource: fields.openDateSource ?? "",
    deadlineSource: fields.deadlineSource ?? "",
    requirement: fields.requirement ?? "",
    benefit: fields.benefit ?? "",
    resourceUrl: fields.resourceUrl ?? "",
    completeEligibilityRequirements: fields.completeEligibilityRequirements ?? "",
    completeBenefits: fields.completeBenefits ?? "",
    materialsRequired: fields.materialsRequired ?? "",
  };

  const elig = extractBulletKeyValues(raw.completeEligibilityRequirements);
  const ben = extractBulletKeyValues(raw.completeBenefits);
  const mat = extractBulletKeyValues(raw.materialsRequired);

  return {
    id,
    raw,
    levels: parseDegreeLevels(raw.level),
    eligibility: {
      minimumAge: parseNumericRequirement(elig.get("Minimum Age")),
      maximumAge: parseNumericRequirement(elig.get("Maximum Age")),
      gender: parseGenderRequirement(elig.get("Gender")),
      minGpa: parseNumericRequirement(elig.get("Min. GPA")),
      backgroundStudy: parseTextRequirement(elig.get("Background Study")),
      ielts: parseNumericRequirement(elig.get("IELTS") ?? elig.get("IELTS/TOEFL")),
      toeflItp: parseNumericRequirement(elig.get("Min. TOEFL iTP")),
      toeflIbt: parseNumericRequirement(elig.get("Min. TOEFL iBT")),
      otherEnglishReq: parseTextRequirement(elig.get("Other English Req")),
      workExperience: parseTextRequirement(elig.get("Work Experience")),
      studyPeriod: parseTextRequirement(elig.get("Study Period")),
      graduatedStatus: parseTextRequirement(elig.get("Graduated/SKL")),
      languageTraining: parseBooleanRequirement(elig.get("Language Training")),
      otherRequirements: parseTextRequirement(elig.get("Other Requirements")),
      language: parseTextRequirement(elig.get("Language")),
    },
    benefits: {
      fundingType: parseFundingType(ben.get("Full/Partial")),
      tuitionFee: parseBooleanRequirement(ben.get("Tuition Fee")),
      livingExpenses: parseBooleanRequirement(ben.get("Living Expenses")),
      airfare: parseBooleanRequirement(ben.get("Airfare")),
      healthInsurance: parseBooleanRequirement(ben.get("Health Insurance")),
      visa: parseBooleanRequirement(ben.get("Visa")),
      arrivalAllowance: parseBooleanRequirement(ben.get("Arrival Allowance")),
      otherBenefits: ben.get("Other Benefits") ?? "",
    },
    materials: {
      essayPersonalStatement: parseBooleanRequirement(mat.get("Essay/Personal Statement")),
      studyPlan: parseBooleanRequirement(mat.get("Study Plan")),
      letterOfAcceptance: parseBooleanRequirement(mat.get("Letter of Acceptance")),
      letterOfRecommendation: parseBooleanRequirement(mat.get("Letter of Recommendation")),
      transcriptGpa: parseBooleanRequirement(mat.get("Transcript/GPA")),
      englishTestScores: parseBooleanRequirement(mat.get("English Test Scores")),
      interview: parseBooleanRequirement(mat.get("Interview")),
      resumeCv: parseBooleanRequirement(mat.get("Resume/CV")),
      financialRecords: parseBooleanRequirement(mat.get("Financial Records")),
      governmentStatement: parseBooleanRequirement(mat.get("Government Statement")),
      passportId: parseBooleanRequirement(mat.get("Passport/ID")),
      motivationalLetter: parseBooleanRequirement(mat.get("Motivational Letter")),
      researchProposal: parseBooleanRequirement(mat.get("Research Proposal")),
      otherMaterials: mat.get("Other Materials") ?? "",
    },
    countryTag: deriveCountryTag(raw.scholarshipName, raw.resourceUrl),
    provenance: {
      sourceType: "DATABASE",
      sourceReference: `Excel row ${id}`,
    },
  };
}

function computeMetricRegistry(records: ScholarshipRecord[]): MetricDefinition[] {
  const total = records.length || 1;
  const countKnown = (pick: (r: ScholarshipRecord) => { kind: string }) =>
    records.filter((r) => pick(r).kind !== "absent").length;
  const countTextPresent = (pick: (r: ScholarshipRecord) => { present: boolean }) =>
    records.filter((r) => pick(r).present).length;

  const defs: Omit<MetricDefinition, "frequency" | "frequencyRatio">[] = [
    { key: "targetLevel", category: "education", label: "Jenjang studi", type: "multi_choice" },
    { key: "fundingType", category: "preferences", label: "Jenis pendanaan", type: "single_choice" },
    { key: "gender", category: "personal", label: "Gender (khusus perempuan)", type: "single_choice" },
    { key: "graduatedStatus", category: "education", label: "Status kelulusan", type: "text" },
    { key: "backgroundStudy", category: "education", label: "Bidang studi", type: "text" },
    { key: "maximumAge", category: "personal", label: "Usia maksimal", type: "number" },
    { key: "minimumAge", category: "personal", label: "Usia minimal", type: "number" },
    { key: "minGpa", category: "education", label: "GPA minimal", type: "number" },
    { key: "workExperience", category: "experience", label: "Pengalaman kerja", type: "text" },
    { key: "ielts", category: "language", label: "Skor IELTS", type: "number" },
    { key: "otherEnglishReq", category: "language", label: "Tes bahasa Inggris lain", type: "text" },
    { key: "language", category: "language", label: "Bahasa pengantar program", type: "text" },
    { key: "toeflItp", category: "language", label: "Skor TOEFL iTP", type: "number" },
    { key: "toeflIbt", category: "language", label: "Skor TOEFL iBT", type: "number" },
  ];

  const counters: Record<string, number> = {
    targetLevel: records.filter((r) => r.levels.length > 0).length,
    fundingType: records.filter((r) => r.benefits.fundingType !== "unknown").length,
    gender: countKnown((r) => r.eligibility.gender),
    graduatedStatus: countTextPresent((r) => r.eligibility.graduatedStatus),
    backgroundStudy: countTextPresent((r) => r.eligibility.backgroundStudy),
    maximumAge: countKnown((r) => r.eligibility.maximumAge),
    minimumAge: countKnown((r) => r.eligibility.minimumAge),
    minGpa: countKnown((r) => r.eligibility.minGpa),
    workExperience: countTextPresent((r) => r.eligibility.workExperience),
    ielts: countKnown((r) => r.eligibility.ielts),
    otherEnglishReq: countTextPresent((r) => r.eligibility.otherEnglishReq),
    language: countTextPresent((r) => r.eligibility.language),
    toeflItp: countKnown((r) => r.eligibility.toeflItp),
    toeflIbt: countKnown((r) => r.eligibility.toeflIbt),
  };

  return defs
    .map((d) => ({ ...d, frequency: counters[d.key] ?? 0, frequencyRatio: (counters[d.key] ?? 0) / total }))
    .sort((a, b) => b.frequency - a.frequency);
}

function main() {
  if (!existsSync(SOURCE_XLSX)) {
    console.error(`Source workbook not found at ${SOURCE_XLSX}`);
    process.exit(1);
  }

  const extractDir = extractXlsx(SOURCE_XLSX);
  try {
    const sharedStrings = parseSharedStrings(extractDir);
    const sheets = parseWorkbookSheets(extractDir);
    const fullDbSheet = sheets.find((s) => s.name.includes("Full Database"));
    if (!fullDbSheet) {
      throw new Error(`Could not find a "Full Database" sheet. Sheets found: ${sheets.map((s) => s.name).join(", ")}`);
    }

    const rows = parseSheetRows(fullDbSheet.path, sharedStrings);
    const { row: headerRow, colToField } = findHeaderRow(rows);

    const dataRows = rows.filter((r) => r.rowNumber > headerRow.rowNumber);
    const records: ScholarshipRecord[] = [];
    let nextId = 1;
    for (const row of dataRows) {
      const fields: Record<string, string> = {};
      for (const [col, field] of colToField) {
        fields[field] = row.cells[col] ?? "";
      }
      if (!fields.scholarshipName?.trim()) continue;
      records.push(buildScholarshipRecord(nextId, fields));
      nextId++;
    }

    if (records.length === 0) {
      throw new Error("Parsed zero scholarship records - header detection or column mapping likely broke");
    }

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, "scholarships.json"), JSON.stringify(records, null, 2));
    writeFileSync(join(OUT_DIR, "metrics.json"), JSON.stringify(computeMetricRegistry(records), null, 2));
    writeFileSync(
      join(OUT_DIR, "build-info.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), recordCount: records.length, sourceFile: "scholarship-calendar.xlsx" }, null, 2),
    );

    console.log(`Parsed ${records.length} scholarship records -> ${OUT_DIR}`);
  } finally {
    cleanupExtracted(extractDir);
  }
}

main();

"use client";

import { useState } from "react";
import { profileCompleteness } from "@/lib/profile";
import type { UserProfile } from "@/lib/types";

interface FieldConfig {
  label: string;
  placeholder: string;
  get: (p: UserProfile) => number | undefined;
  set: (p: UserProfile, v: number | undefined) => UserProfile;
}

const FIELD_CONFIG: Record<string, FieldConfig> = {
  maximumAge: {
    label: "Usia kamu (tahun)",
    placeholder: "cth. 24",
    get: (p) => p.personal.age,
    set: (p, v) => ({ ...p, personal: { ...p.personal, age: v } }),
  },
  minimumAge: {
    label: "Usia kamu (tahun)",
    placeholder: "cth. 24",
    get: (p) => p.personal.age,
    set: (p, v) => ({ ...p, personal: { ...p.personal, age: v } }),
  },
  minGpa: {
    label: "GPA kamu (skala 4.0)",
    placeholder: "cth. 3.5",
    get: (p) => p.education.gpa,
    set: (p, v) => ({ ...p, education: { ...p.education, gpa: v } }),
  },
  workExperience: {
    label: "Pengalaman kerja (tahun)",
    placeholder: "cth. 2",
    get: (p) => p.experience.workExperienceYears,
    set: (p, v) => ({ ...p, experience: { ...p.experience, workExperienceYears: v } }),
  },
  toeflItp: {
    label: "Skor TOEFL iTP",
    placeholder: "cth. 550",
    get: (p) => p.language.toeflItp,
    set: (p, v) => ({ ...p, language: { ...p.language, toeflItp: v } }),
  },
};

// maximumAge and minimumAge are distinct database columns but both read/write
// the same single "age" profile field - collapse them before deduping so the
// form doesn't render two identical "Usia kamu" inputs.
const FIELD_GROUP: Record<string, string> = { minimumAge: "maximumAge" };

export function ImproveProfile({ profile, onChange, metricKeys }: { profile: UserProfile; onChange: (p: UserProfile) => void; metricKeys: string[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const grouped = metricKeys.map((k) => FIELD_GROUP[k] ?? k);
  const uniqueFields = [...new Set(grouped)].filter((k) => FIELD_CONFIG[k]);
  const completeness = profileCompleteness(profile);

  if (collapsed || uniqueFields.length === 0) {
    return null;
  }

  return (
    <div className="improve-card">
      <div className="results-title-row" style={{ gap: 8 }}>
        <div>
          <div className="q-title" style={{ fontSize: 17 }}>
            Lengkapi profil buat hasil lebih akurat
          </div>
          <div className="q-sub">Profil kamu {completeness}% lengkap (dihitung dari seberapa sering data ini dibutuhkan beasiswa).</div>
        </div>
        <button type="button" className="expand-btn" onClick={() => setCollapsed(true)}>
          Sembunyikan
        </button>
      </div>
      <div className="completeness-track">
        <div className="completeness-fill" style={{ width: `${completeness}%` }} />
      </div>
      <div className="chip-grid single" style={{ marginTop: 6 }}>
        {uniqueFields.map((key) => {
          const cfg = FIELD_CONFIG[key];
          const value = cfg.get(profile);
          return (
            <div key={key} className="q-field">
              <label htmlFor={`improve-${key}`}>{cfg.label}</label>
              <input
                id={`improve-${key}`}
                type="number"
                step="any"
                placeholder={cfg.placeholder}
                value={value ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  onChange(cfg.set(profile, raw === "" ? undefined : Number(raw)));
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { ImproveProfile } from "@/components/ImproveProfile";
import { ScholarshipCard } from "@/components/ScholarshipCard";
import type { MatchResult, MatchStatus, RegionKey, ScholarshipRecord, UserProfile, WithWithoutAll } from "@/lib/types";

const STATUS_ORDER: Record<MatchStatus, number> = { MATCH: 0, POSSIBLE_MATCH: 1, INSUFFICIENT_INFORMATION: 2, NOT_ELIGIBLE: 3 };

const FIELD_CATEGORY_LABEL: Record<string, string> = {
  stem: "STEM",
  social_humanities: "Sosial & Humaniora",
  business_economics: "Bisnis & Ekonomi",
  health: "Kesehatan",
  other: "Lainnya",
};

const FUNDING_LABEL: Record<string, string> = { full: "Full Funded", partial: "Partial", none: "No scholarship" };
const REGION_LABEL: Record<RegionKey, string> = { europe: "Eropa", asia: "Asia", uk: "UK", us: "US" };

function messageForCount(n: number): string {
  if (n === 0) return "Belum ada yang cocok persis, coba longgarkan filter atau lengkapi profil ya.";
  if (n <= 10) return "Sedikit tapi niche banget buat profil kamu. Worth checking one by one.";
  if (n <= 50) return "Solid! Ini daftar target yang realistis buat mulai dikejar.";
  return "Banyak banget pilihannya, waktunya mulai eliminasi & bikin prioritas.";
}

function withWithoutAllLabel(label: string, pref: WithWithoutAll[]): string {
  const wantWith = pref.includes("with");
  const wantWithout = pref.includes("without");
  if (pref.includes("all") || (wantWith && wantWithout)) return `${label}: semua`;
  if (wantWith) return `${label}: wajib`;
  if (wantWithout) return `${label}: nggak wajib`;
  return `${label}: semua`;
}

function filterLabelSummary(profile: UserProfile): string[] {
  const tags: string[] = [];
  const genderLabel = { perempuan: "Perempuan", "laki-laki": "Laki-laki", prefer_not_say: "Semua gender" }[profile.personal.gender ?? "prefer_not_say"];
  tags.push(genderLabel ?? "Semua gender");
  tags.push(profile.education.targetLevels.length ? profile.education.targetLevels.join("/") : "Semua jenjang");
  tags.push(profile.education.fieldCategory ? FIELD_CATEGORY_LABEL[profile.education.fieldCategory] : "Semua bidang");
  if (profile.preferences.funding.includes("all")) tags.push("Semua pendanaan");
  else tags.push(profile.preferences.funding.map((f) => FUNDING_LABEL[f] ?? f).join(" + "));
  if (profile.preferences.excludedRegions.length) tags.push("Skip: " + profile.preferences.excludedRegions.map((r) => REGION_LABEL[r]).join(", "));
  else tags.push("Semua wilayah");
  tags.push(withWithoutAllLabel("IELTS", profile.preferences.ieltsPreference));
  tags.push(withWithoutAllLabel("Essay", profile.preferences.essayPreference));
  tags.push(withWithoutAllLabel("Interview", profile.preferences.interviewPreference));
  return tags;
}

export function ResultsScreen({
  name,
  scholarships,
  totalCount,
  matches,
  favorites,
  onToggleFavorite,
  search,
  onSearchChange,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  showIneligible,
  onToggleShowIneligible,
  countryTags,
  excludedCountryTags,
  onToggleCountryTag,
  profile,
  onProfileChange,
  nextMetricKeys,
  onEditAnswers,
  onRestart,
  onOpenDetail,
}: {
  name: string;
  scholarships: ScholarshipRecord[];
  totalCount: number;
  matches: Map<number, MatchResult>;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  search: string;
  onSearchChange: (v: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  showIneligible: boolean;
  onToggleShowIneligible: () => void;
  countryTags: string[];
  excludedCountryTags: string[];
  onToggleCountryTag: (tag: string) => void;
  profile: UserProfile;
  onProfileChange: (p: UserProfile) => void;
  nextMetricKeys: string[];
  onEditAnswers: () => void;
  onRestart: () => void;
  onOpenDetail: (id: number) => void;
}) {
  const eligibleCount = scholarships.filter((s) => {
    const st = matches.get(s.id)?.status;
    return st === "MATCH" || st === "POSSIBLE_MATCH";
  }).length;

  let displayList = scholarships;
  if (showFavoritesOnly) displayList = displayList.filter((s) => favorites.includes(s.id));
  else if (search.trim()) {
    const q = search.trim().toLowerCase();
    displayList = displayList.filter((s) => s.raw.scholarshipName.toLowerCase().includes(q));
  }
  if (!showIneligible) displayList = displayList.filter((s) => matches.get(s.id)?.status !== "NOT_ELIGIBLE");

  displayList = [...displayList].sort((a, b) => {
    const sa = STATUS_ORDER[matches.get(a.id)!.status];
    const sb = STATUS_ORDER[matches.get(b.id)!.status];
    if (sa !== sb) return sa - sb;
    return a.raw.scholarshipName.localeCompare(b.raw.scholarshipName);
  });

  return (
    <section className="screen">
      <div className="results-head">
        <div className="results-title-row">
          <div>
            <h2 className="results-title">Halo, {name}! 👋</h2>
            <div className="results-sub">{messageForCount(eligibleCount)}</div>
          </div>
          <div className="match-badge">
            {eligibleCount} / {totalCount} cocok
          </div>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Cari nama beasiswa…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="spacer" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={onEditAnswers}>
            ✏️ Ubah Jawaban
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRestart}>
            ↺ Mulai Ulang
          </button>
        </div>

        <div className="filter-bar">
          {filterLabelSummary(profile).map((t) => (
            <span key={t} className="filter-tag">
              {t}
            </span>
          ))}
          <span className="filter-tag is-clickable" onClick={onToggleFavoritesOnly} style={{ cursor: "pointer" }}>
            {showFavoritesOnly ? "❤️ Lihat semua" : `❤️ ${favorites.length} disimpan`}
          </span>
          <span className="filter-tag is-clickable" onClick={onToggleShowIneligible} style={{ cursor: "pointer" }}>
            {showIneligible ? "Sembunyikan yang belum eligible" : "Tampilkan yang belum eligible"}
          </span>
          {countryTags.map((tag) => (
            <span
              key={tag}
              className="filter-tag is-clickable"
              style={{ cursor: "pointer", opacity: excludedCountryTags.includes(tag) ? 0.5 : 1 }}
              onClick={() => onToggleCountryTag(tag)}
            >
              {excludedCountryTags.includes(tag) ? `🚫 ${tag}` : `🌍 ${tag}`}
            </span>
          ))}
        </div>
      </div>

      <ImproveProfile profile={profile} onChange={onProfileChange} metricKeys={nextMetricKeys} />

      <div className="grid">
        {displayList.map((s, i) => (
          <ScholarshipCard
            key={s.id}
            scholarship={s}
            matchResult={matches.get(s.id)!}
            isFavorite={favorites.includes(s.id)}
            onToggleFavorite={() => onToggleFavorite(s.id)}
            onOpenDetail={() => onOpenDetail(s.id)}
            animationIndex={i}
          />
        ))}
      </div>

      {displayList.length === 0 && (
        <div className="empty-state">
          <div className="big-emoji">🧐</div>
          <h3 className="display">Belum ada yang cocok persis</h3>
          <p style={{ color: "var(--text-muted)" }}>
            Coba longgarkan satu atau dua filter, atau lengkapi profil kamu. Beasiswa yang pas masih ada kok, cuma perlu dicari dengan kriteria yang
            lebih lebar.
          </p>
          <button type="button" className="btn btn-primary" onClick={onEditAnswers}>
            Ubah Jawaban
          </button>
        </div>
      )}

      <footer className="notes">
        <strong>Tentang data ini:</strong> ditarik langsung dari database beasiswa kamu (
        {totalCount} beasiswa). Status &quot;Cocok&quot;/&quot;Kemungkinan cocok&quot;/&quot;Belum eligible&quot; dihitung otomatis dari kolom
        syarat tiap beasiswa dibanding profil kamu - kalau datanya nggak disebutkan di database, kami tandai sebagai belum diketahui, bukan
        dianggap tidak perlu. Database nggak punya kolom &quot;negara&quot; sendiri, jadi tag wilayah (dan filter &quot;Skip wilayah&quot;) kami
        tebak dari domain website resminya - beasiswa yang websitenya pakai domain generik (.com/.org/.edu/.gov) mungkin nggak kedeteksi
        wilayahnya dan tetap muncul walau wilayahnya kamu skip. Selalu cek ulang detail lengkap &amp; deadline di halaman resmi sebelum daftar.
      </footer>
    </section>
  );
}

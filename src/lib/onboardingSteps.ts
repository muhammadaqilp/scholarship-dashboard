export interface ChipOption {
  value: string;
  label: string;
  icon: string;
  isAll?: boolean;
}

export interface StepDef {
  key: string;
  title: string;
  sub?: string;
  type: "single" | "multi" | "number";
  options?: ChipOption[];
}

// The first 6 steps are the original scholarship-quest.html wizard, preserved
// verbatim (wording, options, order) - only wired up to the new matching
// engine and preference filters instead of the old hard client-side filter.
// Steps after that are new additions for the richer profile; per the user,
// existing questions never get removed, only added to.
export const BASIC_QUEST_STEPS: StepDef[] = [
  {
    key: "gender",
    title: "Pilih identitasmu",
    sub: "Beberapa beasiswa khusus dibuka untuk perempuan. Ini cuma buat nyaring yang eligible, bukan buat cap dirimu.",
    type: "single",
    options: [
      { value: "perempuan", label: "Perempuan", icon: "👩" },
      { value: "laki-laki", label: "Laki-laki", icon: "👨" },
      { value: "prefer_not_say", label: "Nggak mau sebutin", icon: "🙂" },
    ],
  },
  {
    key: "funding",
    title: "Beasiswa kayak apa yang kamu buru?",
    sub: "Boleh pilih lebih dari satu. 'Semua' bikin filter dana nggak berlaku.",
    type: "multi",
    options: [
      { value: "full", label: "Full Funded", icon: "💰" },
      { value: "partial", label: "Partial", icon: "🪙" },
      { value: "none", label: "Nggak masalah walau nggak ada beasiswa", icon: "🤷" },
      { value: "all", label: "Semua, boleh apa aja", icon: "✨", isAll: true },
    ],
  },
  {
    key: "region",
    title: "Ada wilayah yang pengen kamu skip?",
    sub: "Pilih wilayah yang NGGAK kamu incar. Nggak pilih apa-apa = semua wilayah tetap kebuka.",
    type: "multi",
    options: [
      { value: "europe", label: "Eropa", icon: "🏰" },
      { value: "asia", label: "Asia", icon: "🌏" },
      { value: "uk", label: "UK", icon: "🇬🇧" },
      { value: "us", label: "US", icon: "🗽" },
    ],
  },
  {
    key: "ieltsPreference",
    title: "Soal IELTS / tes bahasa Inggris, gimana?",
    sub: "'Dengan IELTS' = IELTS termasuk salah satu tes yang diterima.",
    type: "multi",
    options: [
      { value: "with", label: "Yang wajib IELTS", icon: "📘" },
      { value: "without", label: "Yang nggak wajib IELTS", icon: "🚫" },
      { value: "all", label: "Semua aja", icon: "✨", isAll: true },
    ],
  },
  {
    key: "essayPreference",
    title: "Siap nulis essay?",
    type: "multi",
    options: [
      { value: "with", label: "Yang ada essay", icon: "✍️" },
      { value: "without", label: "Yang nggak ada essay", icon: "🚫" },
      { value: "all", label: "Semua aja", icon: "✨", isAll: true },
    ],
  },
  {
    key: "interviewPreference",
    title: "Gimana soal interview?",
    type: "multi",
    options: [
      { value: "with", label: "Yang ada interview", icon: "🎤" },
      { value: "without", label: "Yang nggak ada interview", icon: "🚫" },
      { value: "all", label: "Semua aja", icon: "✨", isAll: true },
    ],
  },
  {
    key: "targetLevels",
    title: "Jenjang apa yang kamu incar?",
    sub: "Boleh pilih lebih dari satu.",
    type: "multi",
    options: [
      { value: "S1", label: "S1", icon: "🎓" },
      { value: "S2", label: "S2", icon: "🎓" },
      { value: "S3", label: "S3", icon: "🎓" },
      { value: "D3D4", label: "Diploma (D3/D4)", icon: "📘" },
      { value: "NonDegree", label: "Short course / non-gelar", icon: "✨" },
    ],
  },
  {
    key: "fieldCategory",
    title: "Bidang studi kamu apa?",
    sub: "Pilih kategori yang paling dekat. Kamu juga bisa isi bidang spesifik di halaman hasil nanti.",
    type: "single",
    options: [
      { value: "stem", label: "STEM (Sains, Teknik, dll)", icon: "🔬" },
      { value: "social_humanities", label: "Sosial & Humaniora", icon: "📚" },
      { value: "business_economics", label: "Bisnis & Ekonomi", icon: "💼" },
      { value: "health", label: "Kesehatan", icon: "🩺" },
      { value: "other", label: "Lainnya", icon: "🧩" },
    ],
  },
  {
    key: "graduationStatus",
    title: "Status pendidikanmu sekarang gimana?",
    type: "single",
    options: [
      { value: "still_studying", label: "Masih kuliah / sekolah", icon: "📖" },
      { value: "final_year", label: "Tingkat akhir", icon: "⏳" },
      { value: "graduated_awaiting_certificate", label: "Sudah SKL, ijazah nyusul", icon: "📄" },
      { value: "graduated_with_diploma", label: "Sudah lulus & pegang ijazah", icon: "✅" },
    ],
  },
  {
    key: "ieltsScore",
    title: "Ada skor IELTS?",
    sub: "Kalau belum punya, skip aja - nanti bisa diisi belakangan buat hasil yang lebih akurat.",
    type: "number",
  },
];

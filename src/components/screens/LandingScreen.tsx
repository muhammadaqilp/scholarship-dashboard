"use client";

import { BASIC_QUEST_STEPS } from "@/lib/onboardingSteps";

export function LandingScreen({
  total,
  name,
  onNameChange,
  onStart,
}: {
  total: number;
  name: string;
  onNameChange: (v: string) => void;
  onStart: () => void;
}) {
  return (
    <section className="screen">
      <div className="landing-wrap">
        <div className="eyebrow">Base camp</div>
        <h1 className="hero-title">
          {total} beasiswa.
          <br />
          Satu peta, nol drama<em>.</em>
        </h1>
        <p className="hero-sub">
          Mau apply beasiswa abroad tapi cuma tau LPDP, AAS, sama Erasmus? Atau masih bingung harus mulai dari mana? Yuk mulai study abroad
          preparation tanpa stress.
        </p>

        <div className="stat-strip">
          <div className="stat-chip">
            <b>{total}</b>
            <span>total beasiswa</span>
          </div>
          <div className="stat-chip">
            <b>{BASIC_QUEST_STEPS.length}</b>
            <span>level onboarding</span>
          </div>
          <div className="stat-chip">
            <b>~1 min</b>
            <span>buat mulai</span>
          </div>
        </div>

        <div className="name-card">
          <label htmlFor="name-input">Siapa nama kamu?</label>
          <input
            type="text"
            id="name-input"
            placeholder="cth. Salsa"
            autoComplete="given-name"
            maxLength={40}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onStart();
            }}
          />
          <div className="hint-row">
            ✨ <span>Nama ini cuma dipakai buat sapaan di halaman hasil, disimpan di browser kamu sendiri dan nggak dikirim ke mana-mana.</span>
          </div>
          <button type="button" id="start-btn" className="btn btn-primary btn-block" onClick={onStart}>
            Yuk, Mulai →
          </button>
        </div>

        <div className="trust-row">
          <span>🔒 Data cuma di browser kamu</span>
          <span>🗂️ Sumber: database beasiswa kamu sendiri</span>
          <span>🔁 Bisa diulang kapan aja</span>
        </div>
      </div>
    </section>
  );
}

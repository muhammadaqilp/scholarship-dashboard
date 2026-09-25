"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccessGate } from "@/components/AccessGate";
import { Brand } from "@/components/Brand";
import { DetailModal } from "@/components/DetailModal";
import { LoadingShell } from "@/components/LoadingShell";
import { ToastRoot } from "@/components/Toast";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { OnboardingScreen } from "@/components/screens/OnboardingScreen";
import { RevealScreen } from "@/components/screens/RevealScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import { burstConfetti } from "@/lib/confetti";
import { BASIC_QUEST_STEPS } from "@/lib/onboardingSteps";
import { filterByPreferences, matchAll } from "@/lib/matching";
import { nextHighValueMetrics } from "@/lib/profile";
import { getAllCountryTags, getScholarshipById, SCHOLARSHIPS } from "@/lib/scholarships";
import { loadPersistedState, savePersistedState, type PersistedState } from "@/lib/storage";
import type { UserProfile, VerificationRecord } from "@/lib/types";

type Screen = "landing" | "onboarding" | "reveal" | "results";

let toastSeq = 0;

export function App() {
  // Single object (rather than four separate useState calls) so the
  // post-mount localStorage hydration is one setState call, not a cascade -
  // localStorage can only be read client-side, so this can't be initial state.
  const [persisted, setPersisted] = useState<PersistedState | null>(null);
  const [screen, setScreen] = useState<Screen>("landing");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showIneligible, setShowIneligible] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const accessGate = useAccessGate();

  useEffect(() => {
    // localStorage doesn't exist during SSR/first paint, so it can't be read
    // in useState's initializer without a server/client mismatch - this
    // one-time post-mount hydration read is the standard pattern for it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPersisted(loadPersistedState());
  }, []);

  useEffect(() => {
    if (persisted) savePersistedState(persisted);
  }, [persisted]);

  function addToast(msg: string) {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  }

  const profile = persisted?.profile ?? null;
  const filteredByPrefs = useMemo(() => (profile ? filterByPreferences(SCHOLARSHIPS, profile) : []), [profile]);
  const matches = useMemo(() => (profile ? matchAll(profile, filteredByPrefs) : new Map()), [profile, filteredByPrefs]);
  const nextMetricKeys = useMemo(() => (profile ? nextHighValueMetrics(profile, 4) : []), [profile]);
  const countryTags = useMemo(() => getAllCountryTags(), []);

  if (!persisted) {
    return <LoadingShell />;
  }

  function setName(name: string) {
    setPersisted((p) => (p ? { ...p, name } : p));
  }

  function setProfile(profile: UserProfile) {
    setPersisted((p) => (p ? { ...p, profile } : p));
  }

  function handleStart() {
    setPersisted((p) => (p ? { ...p, name: p.name.trim() || "Sobat" } : p));
    setScreen("onboarding");
    setOnboardingStep(0);
  }

  function goReveal() {
    setScreen("reveal");
    setTimeout(() => {
      setScreen("results");
      if (confettiRef.current) burstConfetti(confettiRef.current);
    }, 900);
  }

  function handleOnboardingNext() {
    if (onboardingStep < BASIC_QUEST_STEPS.length - 1) {
      setOnboardingStep((s) => s + 1);
    } else {
      goReveal();
    }
  }

  function handleOnboardingBack() {
    if (onboardingStep === 0) {
      setScreen("landing");
    } else {
      setOnboardingStep((s) => s - 1);
    }
  }

  function toggleFavorite(id: number) {
    setPersisted((p) => {
      if (!p) return p;
      const has = p.favorites.includes(id);
      addToast(has ? "Dihapus dari Daftar Impian" : "Disimpan ke Daftar Impian ✨");
      return { ...p, favorites: has ? p.favorites.filter((f) => f !== id) : [...p.favorites, id] };
    });
  }

  function toggleCountryTag(tag: string) {
    setPersisted((p) => {
      if (!p) return p;
      const excluded = p.profile.preferences.excludedCountryTags.includes(tag)
        ? p.profile.preferences.excludedCountryTags.filter((t) => t !== tag)
        : [...p.profile.preferences.excludedCountryTags, tag];
      return { ...p, profile: { ...p.profile, preferences: { ...p.profile.preferences, excludedCountryTags: excluded } } };
    });
  }

  async function handleVerify(id: number) {
    setVerifyingId(id);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarshipId: id }),
      });
      const data: VerificationRecord = await res.json();
      setPersisted((p) => (p ? { ...p, verifications: { ...p.verifications, [id]: data } } : p));
    } catch {
      addToast("Online verification lagi nggak bisa diakses. Data database tetap tersedia.");
    } finally {
      setVerifyingId(null);
    }
  }

  const detailScholarship = detailId !== null ? getScholarshipById(detailId) : undefined;

  return (
    <div id="app">
      <header className="topbar">
        <Brand />
        <div className="topbar-meta">
          {screen === "results" && (
            <div className="fav-pill" onClick={() => setShowFavoritesOnly((v) => !v)}>
              ❤️ {persisted.favorites.length} disimpan
            </div>
          )}
          {accessGate && (
            <div
              className="fav-pill"
              title="Kunci Scholarship Quest"
              onClick={() => {
                if (window.confirm("Kunci Scholarship Quest? Kamu harus masukin kode akses lagi buat buka lagi nanti.")) {
                  accessGate.onLock();
                }
              }}
            >
              🔒
            </div>
          )}
        </div>
      </header>

      <main id="main">
        {screen === "landing" && <LandingScreen total={SCHOLARSHIPS.length} name={persisted.name} onNameChange={setName} onStart={handleStart} />}

        {screen === "onboarding" && profile && (
          <OnboardingScreen
            name={persisted.name}
            stepIndex={onboardingStep}
            profile={profile}
            onChange={setProfile}
            onNext={handleOnboardingNext}
            onBack={handleOnboardingBack}
          />
        )}

        {screen === "reveal" && <RevealScreen total={SCHOLARSHIPS.length} />}

        {screen === "results" && profile && (
          <ResultsScreen
            name={persisted.name}
            scholarships={filteredByPrefs}
            totalCount={SCHOLARSHIPS.length}
            matches={matches}
            favorites={persisted.favorites}
            onToggleFavorite={toggleFavorite}
            search={search}
            onSearchChange={setSearch}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavoritesOnly={() => setShowFavoritesOnly((v) => !v)}
            showIneligible={showIneligible}
            onToggleShowIneligible={() => setShowIneligible((v) => !v)}
            countryTags={countryTags}
            excludedCountryTags={profile.preferences.excludedCountryTags}
            onToggleCountryTag={toggleCountryTag}
            profile={profile}
            onProfileChange={setProfile}
            nextMetricKeys={nextMetricKeys}
            onEditAnswers={() => {
              setScreen("onboarding");
              setOnboardingStep(0);
            }}
            onRestart={() => setScreen("landing")}
            onOpenDetail={setDetailId}
          />
        )}
      </main>

      {detailScholarship && (
        <DetailModal
          scholarship={detailScholarship}
          matchResult={matches.get(detailScholarship.id)!}
          verification={persisted.verifications[detailScholarship.id]}
          verifying={verifyingId === detailScholarship.id}
          onVerify={() => handleVerify(detailScholarship.id)}
          onClose={() => setDetailId(null)}
        />
      )}

      <ToastRoot toasts={toasts} />
      <canvas id="confetti-canvas" ref={confettiRef} />
    </div>
  );
}

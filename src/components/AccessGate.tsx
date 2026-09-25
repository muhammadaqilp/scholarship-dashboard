"use client";

// Static access-code gate in front of the existing Scholarship Quest app.
// This is intentionally NOT real authentication - it's a client-side check
// against a hashed code baked in at build time (see src/lib/access.ts and
// scripts/build-access-code.ts). A technically determined visitor could
// inspect the bundle and bypass it. Its actual job is smaller and honest:
// stop casual unauthorized access and give paying customers a clean unlock
// experience, not run a license-management platform.
import { createContext, useContext, useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { LoadingShell } from "@/components/LoadingShell";
import { checkAccessCode, isUnlocked, lock, unlock } from "@/lib/access";
import { ACCESS_CODE_HASH } from "@/lib/accessConfig";

const PURCHASE_URL = process.env.NEXT_PUBLIC_PURCHASE_URL;

type GateStatus = "checking" | "locked" | "unlocked";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // localStorage doesn't exist during SSR/first paint, so it can't be read
    // in useState's initializer without a server/client mismatch - this
    // one-time post-mount hydration read is the standard pattern for it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(isUnlocked() ? "unlocked" : "locked");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await checkAccessCode(code, ACCESS_CODE_HASH);
    setSubmitting(false);
    if (result === "empty") {
      setError("Masukkan kode akses kamu dulu, ya.");
      return;
    }
    if (result === "invalid") {
      setError("Kode aksesnya kayaknya belum pas. Coba dicek lagi ya.");
      return;
    }
    unlock();
    setStatus("unlocked");
  }

  function handleLock() {
    lock();
    setCode("");
    setError("");
    setStatus("locked");
  }

  if (status === "checking") {
    return <LoadingShell />;
  }

  if (status === "unlocked") {
    return <AccessGateContext.Provider value={{ onLock: handleLock }}>{children}</AccessGateContext.Provider>;
  }

  return (
    <div id="app">
      <header className="topbar">
        <Brand />
      </header>
      <main id="main">
        <section className="screen">
          <div className="landing-wrap">
            <div className="eyebrow">Gerbang Quest</div>
            <h1 className="hero-title">
              Kode akses dulu,
              <br />
              baru mulai quest-nya<em>.</em>
            </h1>
            <p className="hero-sub">
              Scholarship Quest ini akses berbayar. Masukkan kode akses yang kamu terima setelah pembelian buat buka aplikasinya.
            </p>

            <form className="name-card" onSubmit={handleSubmit}>
              <label htmlFor="access-code-input">Kode Akses</label>
              <input
                type="text"
                id="access-code-input"
                placeholder="cth. SQ-2026-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError("");
                }}
              />
              {error && (
                <div className="hint-row" style={{ color: "var(--danger)" }}>
                  ⚠️ <span>{error}</span>
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? "Mengecek…" : "Buka Scholarship Quest →"}
              </button>
            </form>

            <div className="trust-row">
              <span>🔒 Kode cuma dicek di browser kamu</span>
              <span>🚫 Nggak ada akun atau password</span>
              <span>💾 Sekali buka, nggak perlu masukin lagi</span>
            </div>

            <div className="hint-row">
              <span>
                Belum punya kode akses?{" "}
                {PURCHASE_URL ? (
                  <a href={PURCHASE_URL} target="_blank" rel="noopener noreferrer">
                    Beli akses Scholarship Quest dulu, yuk →
                  </a>
                ) : (
                  "Beli akses Scholarship Quest dulu, ya."
                )}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const AccessGateContext = createContext<{ onLock: () => void } | null>(null);

/** Lets any descendant (e.g. a small "Kunci Scholarship Quest" control in the
 * topbar) trigger a lock without threading a callback prop through the whole
 * existing App tree. */
export function useAccessGate() {
  return useContext(AccessGateContext);
}

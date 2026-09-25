import { Brand } from "@/components/Brand";

/** Shown for the brief window before we know whether the visitor is unlocked
 * (AccessGate) or before their locally-saved profile has loaded (App) - both
 * are client-only checks that can't resolve during server rendering. Shared
 * so the two back-to-back loading moments look like one continuous state
 * instead of two different "blank" flashes. */
export function LoadingShell() {
  return (
    <div id="app">
      <header className="topbar">
        <Brand />
      </header>
      <main id="main">
        <div className="loading-shell">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
      </main>
    </div>
  );
}

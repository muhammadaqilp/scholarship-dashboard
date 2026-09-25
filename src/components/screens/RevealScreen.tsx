"use client";

export function RevealScreen({ total }: { total: number }) {
  return (
    <section className="screen">
      <div className="reveal-wrap">
        <div className="chest">🎒</div>
        <h2 className="display">Membuka peti beasiswa…</h2>
        <p>
          Lagi nyocokin profilmu ke {total} beasiswa. Bentar ya.
        </p>
        <div className="reveal-checklist">
          <div className="done">✓ Membaca profil kamu</div>
          <div className="done">✓ Mengecek database beasiswa lokal</div>
          <div className="done">✓ Mencocokkan tiap syarat</div>
        </div>
      </div>
    </section>
  );
}

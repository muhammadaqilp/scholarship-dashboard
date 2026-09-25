"use client";

export function ToastRoot({ toasts }: { toasts: { id: number; msg: string }[] }) {
  return (
    <div id="toast-root">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.msg}
        </div>
      ))}
    </div>
  );
}

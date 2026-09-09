"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Check, X, Info } from "lucide-react";

type Toast = { id: string; title: string; description?: string; variant: "success" | "error" | "info" };

const ToastContext = createContext<{
  toast: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToasterProvider>");
  return ctx;
}

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[320px] max-w-sm rounded-2xl border px-4 py-3 shadow-2xl flex gap-3 items-start backdrop-blur ${
              t.variant === "success"
                ? "bg-emerald-500 text-white border-emerald-600"
                : t.variant === "error"
                  ? "bg-red-500 text-white border-red-600"
                  : "bg-zinc-900 text-white border-zinc-800"
            }`}
          >
            <div className="mt-0.5">
              {t.variant === "success" ? <Check className="h-5 w-5" /> : t.variant === "error" ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">{t.title}</p>
              {t.description && <p className="text-xs opacity-90 mt-1 leading-relaxed">{t.description}</p>}
            </div>
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProfesionalWizard } from "@/components/cotizar/ProfesionalWizard";

export default function CotizarProfesionalPage() {
  return (
    <div className="min-h-screen bg-[#171717] text-neutral-200">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-xs font-mono font-bold text-neutral-500 hover:text-white">
            <ArrowLeft className="h-3 w-3" /> /home
          </Link>
          <span className="text-[11px] font-mono font-black tracking-[0.2em] text-white">
            INVENTOV <span className="text-orange-500">·</span> <span className="text-neutral-500">PRO</span>
          </span>
          <span className="text-[11px] font-mono text-neutral-600">SECURE • NDA</span>
        </div>
      </header>
      <main className="px-6 py-8">
        <div className="mx-auto max-w-3xl mb-8 space-y-2">
          <h1 className="text-2xl font-mono font-black tracking-tighter text-white">Prototipado e Ingeniería</h1>
          <p className="text-xs font-mono text-neutral-500">Flujo técnico. Tolerancias, materiales y confidencialidad.</p>
        </div>
        <ProfesionalWizard />
      </main>
    </div>
  );
}

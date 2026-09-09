import Link from "next/link";
import { Check, Mail, Clock, ArrowLeft } from "lucide-react";

export default function ExitoPage() {
  return (
    <div className="min-h-screen bg-[#171717] text-zinc-200 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/50">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
          <span className="text-[11px] font-black tracking-[0.2em] text-white">
            INVENTOV <span className="text-orange-500">·</span> <span className="text-zinc-500">Éxito</span>
          </span>
          <span className="w-20" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-[28px] border border-emerald-500/20 bg-emerald-500/[0.06] p-8 md:p-10 text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Check className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">¡Solicitud recibida!</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Gracias por confiar en INVENTOV. Tu archivo ya está seguro en nuestros buckets y tu cotización está en la cola del Kanban.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex items-start gap-3 text-left">
            <Mail className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Recibirás tu cotización en tu correo pronto</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Tiempo estimado: <span className="text-zinc-300 font-mono">&lt; 24h</span> para B2C y <span className="text-zinc-300 font-mono">&lt; 4h</span> para B2B con NDA.
                Revisa tu bandeja y spam.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-600">
            <Clock className="h-3 w-3" /> Respuesta garantizada · Sin spam
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <Link href="/" className="h-11 px-7 rounded-full bg-white text-zinc-900 font-bold text-sm flex items-center justify-center hover:bg-zinc-100">
              Ir al inicio
            </Link>
            <Link href="/cotizar/casual" className="h-11 px-7 rounded-full bg-zinc-800 border border-zinc-700 text-white font-bold text-sm flex items-center justify-center hover:bg-zinc-700">
              Nueva cotización
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

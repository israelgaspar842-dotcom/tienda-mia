import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Mail, MapPin, Heart, Globe, Share2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-neutral-800 bg-transparent dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/imagenes/logo.png" alt="INVENTOV" width={32} height={32} className="h-8 w-8 rounded-xl object-cover border border-slate-200 dark:border-neutral-700" />
              <span className="text-xs font-black tracking-[0.2em] text-slate-900 dark:text-white">INVENTOV.</span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-neutral-500 max-w-sm leading-relaxed">Impresión 3D bajo demanda para makers, diseñadores y empresas. Desde prototipos hasta series cortas.</p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://wa.me/59173854684" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp INVENTOV" className="h-9 w-9 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white flex items-center justify-center shadow shadow-[#25D366]/20 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-9 w-9 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
                <Share2 className="h-4 w-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-9 w-9 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
                <Globe className="h-4 w-4" />
              </a>
              <a href="mailto:hola@inventov.cl" aria-label="Email" className="h-9 w-9 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black tracking-widest text-slate-500 dark:text-neutral-400 uppercase">Contacto directo</p>
            <a href="https://wa.me/59173854684" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[#25D366] hover:text-[#1ebe5d]">
              <MessageCircle className="h-4 w-4" /> +591 73854684 — WhatsApp
            </a>
            <a href="mailto:hola@inventov.cl" className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white">
              <Mail className="h-4 w-4" /> hola@inventov.cl
            </a>
            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-500">
              <MapPin className="h-4 w-4" /> Sucre, Bolivia — Envíos a todo el país
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black tracking-widest text-slate-500 dark:text-neutral-400 uppercase">Explora</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/cotizar/casual" className="text-slate-600 dark:text-neutral-400 hover:text-orange-500">Cotizar Regalo</Link>
              <Link href="/cotizar/profesional" className="text-slate-600 dark:text-neutral-400 hover:text-orange-500">Cotizar Prototipo</Link>
              <a href="#portfolio" className="text-slate-600 dark:text-neutral-400 hover:text-orange-500">Galería</a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-neutral-600">
          <span>© {new Date().getFullYear()} INVENTOV. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1.5">Hecho con <Heart className="h-3 w-3 text-orange-500" /> en Bolivia</span>
        </div>
      </div>
    </footer>
  );
}

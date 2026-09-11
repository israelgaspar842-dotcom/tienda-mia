"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MessageCircle, Mail, MapPin, Heart, Globe, Share2 } from "lucide-react";

const emptySubscribe = () => () => {};
const getIsClient = () => true;
const getIsServer = () => false;

export function Footer() {
  const { theme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getIsClient, getIsServer);
  const currentTheme = mounted ? (theme === "system" ? resolvedTheme : theme) : undefined;
  const logoSrc = currentTheme === "dark" ? "/imagenes/logo%20negro.jpg" : "/imagenes/logo%20blanco.jpg";

  const socialBtn =
    "p-2.5 rounded-full bg-slate-100 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-orange-500/10 transition-all flex items-center justify-center";

  return (
    <footer className="border-t border-slate-200 dark:border-neutral-800 bg-transparent dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              {!mounted ? (
                <div className="w-10 h-10 rounded-xl bg-transparent dark:bg-zinc-950 border border-transparent animate-pulse" aria-hidden />
              ) : (
                <Image
                  src={logoSrc}
                  alt="INVENTOV"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl object-cover border-0"
                  unoptimized
                />
              )}
              <span className="text-xs font-black tracking-[0.2em] text-slate-900 dark:text-white">INVENTOV.</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Impresión 3D bajo demanda para makers, diseñadores y empresas. Desde prototipos hasta series cortas.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://wa.me/59173854684" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp INVENTOV" className={socialBtn}>
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={socialBtn}>
                <Share2 className="h-4 w-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={socialBtn}>
                <Globe className="h-4 w-4" />
              </a>
              <a href="mailto:hola@inventov.cl" aria-label="Email" className={socialBtn}>
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wider text-slate-900 dark:text-white uppercase">Contacto directo</p>
            {/* Fila de WhatsApp Interactiva */}
            <div className="flex items-center gap-3 text-gray-300 hover:text-[#25D366] transition-colors group">
              <a 
                href="https://wa.me/59173854684?text=Hola%20INVENTOV,%20vengo%20de%20la%20página%20web"
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                <span className="underline-offset-4 group-hover:underline">
                  +591 73854684
                </span>
              </a>
            </div>
            {/* Fila del Portafolio */}
            <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
              <Globe className="w-5 h-5"/>
              <a 
                href="https://israelvelizgaspar.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                Portafolio del Fundador
              </a>
            </div>
            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
              <MapPin className="h-4 w-4" /> Sucre, Bolivia — Envíos a todo el país
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wider text-slate-900 dark:text-white uppercase">Explora</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/cotizar/casual" className="text-sm text-slate-500 dark:text-zinc-400 hover:text-orange-500 transition-colors">
                Cotizar Regalo
              </Link>
              <Link href="/cotizar/profesional" className="text-sm text-slate-500 dark:text-zinc-400 hover:text-orange-500 transition-colors">
                Cotizar Prototipo
              </Link>
              <Link href="/asesoria" className="text-sm text-slate-500 dark:text-zinc-400 hover:text-orange-500 transition-colors">
                Asesoría Técnica
              </Link>
              <Link href="/#portfolio" className="text-sm text-slate-500 dark:text-zinc-400 hover:text-orange-500 transition-colors">
                Galería
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-neutral-600">
          <span>© {new Date().getFullYear()} INVENTOV. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1.5">
            Hecho con <Heart className="h-3 w-3 text-orange-500" /> en Bolivia
          </span>
        </div>
      </div>
    </footer>
  );
}

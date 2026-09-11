"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type Mode = "pro" | "casual";

const emptySubscribe = () => () => {};
const getIsClient = () => true;
const getIsServer = () => false;

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getIsClient, getIsServer);
  const currentTheme = mounted ? (theme === "system" ? resolvedTheme : theme) : undefined;
  const logoSrc = currentTheme === "dark" ? "/imagenes/logo%20negro.jpg" : "/imagenes/logo%20blanco.jpg";

  const mode: Mode = pathname?.startsWith("/cotizar/profesional") ? "pro" : "casual";
  const isPro = mode === "pro";

  const linksPro = [
    { label: "Materiales de Ingeniería", href: "/#materiales" },
    { label: "Seguridad y NDA", href: "/#seguridad" },
    { label: "Portal Empresas", href: "/#empresas" },
  ];

  const linksCasual = [
    { label: "Galería de Regalos", href: "/#portfolio" },
    { label: "Cómo funciona", href: "/#proceso" },
    { label: "Rastrea tu pedido", href: "/#rastreo" },
  ];

  const links = isPro ? linksPro : linksCasual;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-neutral-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo INVENTOV — intercambio según tema (prevención hidratación) */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setMobileOpen(false)}>
          {!mounted ? (
            <div className="h-9 w-9 rounded-xl bg-transparent dark:bg-zinc-950 border border-transparent animate-pulse" aria-hidden />
          ) : (
            <Image
              src={logoSrc}
              alt="INVENTOV logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl object-cover border-0"
              priority
              unoptimized
            />
          )}
          <span className="hidden sm:inline text-[13px] font-black tracking-[0.2em] text-slate-900 dark:text-neutral-100 uppercase">INVENTOV</span>
          {/* Badge modo — desktop al lado del logo */}
          {pathname?.startsWith("/cotizar/") && (
            <span
              className={`hidden lg:inline-flex ml-2 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase
              ${isPro ? "border-orange-500/40 text-orange-400 bg-orange-500/10" : "border-orange-500/30 text-orange-400 bg-orange-500/10"}`}
            >
              {isPro ? "Modo Prototipado" : "Modo Regalos"}
            </span>
          )}
        </Link>

        {/* Nav desktop — dinámica por modo */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/asesoria"
            className="px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800"
          >
            Asesoría
          </Link>
        </nav>

        {/* Acciones derecha */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <ThemeToggle />
          {pathname?.startsWith("/cotizar/") && (
            <span className="lg:hidden inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase text-orange-400">
              {isPro ? "Modo Prototipado" : "Modo Regalos"}
            </span>
          )}

          {isPro ? (
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800">
                Volver a Inicio
              </Button>
            </Link>
          ) : (
            <Link href="/cotizar/casual">
              <Button size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600 text-white">
                Cotizar Regalo
              </Button>
            </Link>
          )}
        </div>

        {/* Hamburguesa mobile */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — misma lógica dinámica */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-neutral-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 py-4 space-y-4">
          {pathname?.startsWith("/cotizar/") && (
            <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-bold tracking-widest uppercase text-orange-400">
              {isPro ? "Modo Prototipado" : "Modo Regalos"}
            </span>
          )}
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/asesoria"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Asesoría
            </Link>
          </nav>
          <div className="pt-3 border-t border-slate-200 dark:border-neutral-800">
            {isPro ? (
              <Link href="/" onClick={() => setMobileOpen(false)} className="block">
                <Button variant="outline" className="w-full rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-700">
                  Volver a Inicio
                </Button>
              </Link>
            ) : (
              <Link href="/cotizar/casual" onClick={() => setMobileOpen(false)} className="block">
                <Button className="w-full rounded-full">Cotizar Regalo</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

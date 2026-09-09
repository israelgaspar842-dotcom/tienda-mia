"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "Credenciales inválidas" : signInError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[28px] p-8 shadow-2xl space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto h-11 w-11 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-lg">I</div>
            <h1 className="text-xl font-black tracking-tight text-white">
              INVENTOV <span className="text-orange-500">·</span> <span className="text-zinc-500 font-semibold">Admin</span>
            </h1>
            <p className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Acceso restringido</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold tracking-widest uppercase text-zinc-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@inventov.cl"
                className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold tracking-widest uppercase text-zinc-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-xl">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-orange-500/20 transition-colors"
            >
              {loading ? "Verificando..." : "Entrar →"}
            </button>

            <p className="text-[11px] text-zinc-600 text-center font-mono">Protegido por Supabase Auth · RLS · pro-vault privado</p>
          </form>
        </div>
        <p className="text-center text-xs text-zinc-600 mt-4">
          ¿Sin cuenta? Crea tu usuario en <span className="text-zinc-400 font-mono">Supabase Dashboard → Authentication → Users</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#171717] flex items-center justify-center text-zinc-500">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}

import { NextResponse } from "next/server";
import { verifyCredentials, createSessionValue, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!username || !password) {
      return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 });
    }

    if (!verifyCredentials(username, password)) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const sessionValue = createSessionValue();
    const res = NextResponse.json({ success: true, message: "Autenticado correctamente" });

    // En dev (http) secure debe ser false, en prod con https true
    const isSecure = process.env.NODE_ENV === "production" && req.headers.get("x-forwarded-proto") !== "http";

    res.cookies.set(SESSION_COOKIE, sessionValue, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return res;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const ESTADOS = ["Pendiente", "Cotizado", "Imprimiendo", "Terminado"] as const;

async function isAdminRequest(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

function isUuid(v: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await params;
    if (!id || (!isUuid(id) && id.length < 8)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.estado !== undefined) {
      if (!(ESTADOS as readonly string[]).includes(body.estado)) {
        return NextResponse.json({ error: `estado debe ser uno de: ${ESTADOS.join(", ")}` }, { status: 400 });
      }
      updates.estado = body.estado;
    }

    if (body.precio_cotizado !== undefined) {
      if (body.precio_cotizado === null || body.precio_cotizado === "") {
        updates.precio_cotizado = null;
      } else {
        const n = Number(body.precio_cotizado);
        if (isNaN(n) || n < 0) {
          return NextResponse.json({ error: "precio_cotizado debe ser >= 0" }, { status: 400 });
        }
        updates.precio_cotizado = Math.round(n * 100) / 100;
      }
    }

    if (body.metadata !== undefined) {
      if (typeof body.metadata !== "object" || Array.isArray(body.metadata) || body.metadata === null) {
        return NextResponse.json({ error: "metadata debe ser un objeto" }, { status: 400 });
      }
      updates.metadata = body.metadata;
    }

    if (body.telefono !== undefined) {
      const tel = String(body.telefono).trim();
      updates.telefono = tel || null;
      // Mantener sincronizado con metadata.telefono si se envía
      if (updates.metadata && typeof updates.metadata === "object") {
        (updates.metadata as Record<string, unknown>).telefono = tel || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("solicitudes").update(updates).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });

    return NextResponse.json(data);
  } catch (e) {
    console.error("PATCH /api/solicitudes/[id]", e);
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await params;
    if (!id || (!isUuid(id) && id.length < 8)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("solicitudes").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/solicitudes/[id]", e);
    const msg = e instanceof Error ? e.message : "Error al eliminar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await params;
    if (!id || (!isUuid(id) && id.length < 8)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("solicitudes").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/solicitudes/[id]", e);
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

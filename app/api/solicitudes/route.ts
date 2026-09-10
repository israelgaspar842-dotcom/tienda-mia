import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { uploadToProVault } from "@/lib/proVault";

const ESTADOS = ["Pendiente", "Cotizado", "Imprimiendo", "Terminado"] as const;
const TIPOS = ["casual", "profesional"] as const;

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

export async function GET(req: Request) {
  try {
    const isAdmin = await isAdminRequest();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const tipo = searchParams.get("tipo_pedido");

    let query = supabase.from("solicitudes").select("*").order("created_at", { ascending: false });

    if (estado && (ESTADOS as readonly string[]).includes(estado)) query = query.eq("estado", estado);
    if (tipo && (TIPOS as readonly string[]).includes(tipo)) query = query.eq("tipo_pedido", tipo);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("GET /api/solicitudes", e);
    const msg = e instanceof Error ? e.message : "Error al obtener solicitudes";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let enlace_archivo: string | undefined;
    let tipo_pedido: string | undefined;
    let metadata: Record<string, unknown> | undefined;
    let telefono: string | null | undefined;
    let nombre: string | null | undefined;
    let usuario_id: string | null | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const fileLegacy = form.get("file") as File | null;
      const modelo3d = (form.get("modelo_3d") as File | null) || fileLegacy;
      const planoPdf = form.get("plano_pdf") as File | null;

      enlace_archivo = (form.get("enlace_archivo") as string | null)?.trim() || undefined;
      tipo_pedido = (form.get("tipo_pedido") as string | null) || undefined;
      const metaRaw = form.get("metadata") as string | null;
      if (metaRaw) {
        try {
          metadata = JSON.parse(metaRaw);
        } catch {
          return NextResponse.json({ error: "metadata JSON inválido" }, { status: 400 });
        }
      }
      telefono = (form.get("telefono") as string | null)?.trim() || null;
      nombre = (form.get("nombre") as string | null)?.trim() || null;
      usuario_id = (form.get("usuario_id") as string | null) || null;
      metadata = metadata ?? {};
      if (nombre && metadata && typeof metadata === "object" && !(metadata as Record<string, unknown>).nombre) {
        (metadata as Record<string, unknown>).nombre = nombre;
      }

      // Modelo 3D → Storage `pro-vault` con nombre ofuscado
      let modeloUrl: string | undefined;
      if (modelo3d && modelo3d.size > 0) {
        const uploaded = await uploadToProVault(modelo3d);
        modeloUrl = `pro-vault/${uploaded.path}`;
        enlace_archivo = modeloUrl;
        (metadata as Record<string, unknown>).modelo_url = modeloUrl;
        (metadata as Record<string, unknown>).modelo_path = uploaded.path;
        (metadata as Record<string, unknown>).archivo_ofuscado = uploaded.path.split("/").pop();
        (metadata as Record<string, unknown>).modelo_ext = modeloUrl.split(".").pop()?.toLowerCase();
      }

      if (planoPdf && planoPdf.size > 0) {
        const uploadedPdf = await uploadToProVault(planoPdf);
        const planoUrl = `pro-vault/${uploadedPdf.path}`;
        (metadata as Record<string, unknown>).plano_url = planoUrl;
        (metadata as Record<string, unknown>).plano_path = uploadedPdf.path;
        (metadata as Record<string, unknown>).plano_ofuscado = uploadedPdf.path.split("/").pop();
        (metadata as Record<string, unknown>).tiene_plano_2d = true;
        const fuente = (metadata as Record<string, unknown>).fuente_definitiva;
        if (fuente !== "modelo_3d" && fuente !== "plano_2d") {
          return NextResponse.json({ error: "Con plano PDF debes elegir fuente_definitiva: 'modelo_3d' o 'plano_2d'" }, { status: 400 });
        }
        const requiere = fuente === "plano_2d";
        (metadata as Record<string, unknown>).requiere_auditoria_manual = requiere;
        (metadata as Record<string, unknown>).costo_auditoria = requiere ? 15 : 0;
        (metadata as Record<string, unknown>).responsabilidad = requiere ? "auditoria_manual_solicitada" : "cliente_asume_modelo_3d";
      } else {
        if ((metadata as Record<string, unknown>).tiene_plano_2d === undefined) {
          (metadata as Record<string, unknown>).tiene_plano_2d = false;
        }
      }

      if (telefono && metadata && typeof metadata === "object") {
        (metadata as Record<string, unknown>).telefono = (metadata as Record<string, unknown>).telefono || telefono;
      }
    } else {
      const body = await req.json();
      enlace_archivo = body.enlace_archivo;
      tipo_pedido = body.tipo_pedido;
      metadata = body.metadata;
      telefono = (body.telefono as string | undefined)?.trim() || null;
      nombre = (body.nombre as string | undefined)?.trim() || (metadata as Record<string, unknown> | undefined)?.["nombre"] as string | undefined || null;
      usuario_id = body.usuario_id ?? null;
      if (telefono && metadata && typeof metadata === "object") {
        (metadata as Record<string, unknown>).telefono = (metadata as Record<string, unknown>).telefono || telefono;
      }
      if (nombre && metadata && typeof metadata === "object" && !(metadata as Record<string, unknown>).nombre) {
        (metadata as Record<string, unknown>).nombre = nombre;
      }
      if (tipo_pedido === "profesional" && metadata && (metadata as Record<string, unknown>).tiene_plano_2d) {
        const fuente = (metadata as Record<string, unknown>).fuente_definitiva;
        if (fuente !== "modelo_3d" && fuente !== "plano_2d") {
          return NextResponse.json({ error: "Con plano PDF debes elegir fuente_definitiva" }, { status: 400 });
        }
      }
    }

    if (!enlace_archivo || typeof enlace_archivo !== "string" || !enlace_archivo.trim()) {
      return NextResponse.json({ error: "enlace_archivo es obligatorio (link o archivo Modelo 3D)" }, { status: 400 });
    }
    if (!tipo_pedido || !TIPOS.includes(tipo_pedido as (typeof TIPOS)[number])) {
      return NextResponse.json({ error: "tipo_pedido debe ser 'casual' o 'profesional'" }, { status: 400 });
    }
    if (metadata !== undefined && (typeof metadata !== "object" || Array.isArray(metadata) || metadata === null)) {
      return NextResponse.json({ error: "metadata debe ser un objeto" }, { status: 400 });
    }

    const telefonoMeta = (metadata as Record<string, unknown> | undefined)?.["telefono"] as string | undefined;
    const telefonoNorm = (telefono || telefonoMeta || "").trim() || null;
    const nombreMeta = (metadata as Record<string, unknown> | undefined)?.["nombre"] as string | undefined;
    // Para profesional, si no hay nombre pero hay empresa, usa empresa como nombre
    const empresaMeta = (metadata as Record<string, unknown> | undefined)?.["empresa"] as string | undefined;
    const nombreNorm = (nombre || nombreMeta || empresaMeta || "").trim() || null;

    // Guardado EXCLUSIVAMENTE con Supabase (PostgreSQL) — sin mongoose
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("solicitudes")
      .insert({
        enlace_archivo: enlace_archivo.trim(),
        tipo_pedido,
        metadata: metadata ?? {},
        telefono: telefonoNorm,
        nombre: nombreNorm,
        usuario_id: usuario_id ?? null,
        estado: "Pendiente",
        precio_cotizado: null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // ──────────────────────────────────────────────────────────────
    // Notificación Discord en tiempo real (Fire and Forget) — no bloquea al cliente
    // Requiere DISCORD_WEBHOOK_URL en .env.local
    // Ubicación: inmediatamente después del INSERT exitoso a solicitudes
    // ──────────────────────────────────────────────────────────────
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.WEBHOOK_URL;
      if (webhookUrl) {
        const meta = (metadata ?? {}) as Record<string, unknown>;
        // Mapeo formData.serviceType === 'diseno' → metadata.requiere_diseno === true
        const isDiseno = meta["requiere_diseno"] === true;
        // formData.modelo_url → metadata.modelo_url o enlace_archivo con extensión 3D
        const hasModeloUrl = Boolean(
          meta["modelo_url"] || (enlace_archivo && /\.(stl|step|stp|3mf|obj)$/i.test(enlace_archivo))
        );
        const discordPayload = {
          embeds: [
            {
              title: "🚨 NUEVA SOLICITUD DE COTIZACIÓN",
              color: 15277568, // Naranja INVENTOV
              fields: [
                {
                  name: "Servicio",
                  value: isDiseno ? "Diseño CAD" : "Solo Impresión",
                  inline: true,
                },
                {
                  name: "Archivos adjuntos",
                  value: hasModeloUrl ? "Sí (STL/STEP)" : "Solo fotos/planos",
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        };

        // Fire-and-forget: no await — no bloquea la respuesta al cliente si el webhook falla
        void fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordPayload),
        }).catch((err) => {
          console.error("[discord webhook] fallo silencioso (no bloquea cliente):", err);
        });
      } else {
        console.warn(
          "[discord webhook] DISCORD_WEBHOOK_URL no configurada — añade DISCORD_WEBHOOK_URL en .env.local (Discord > Integraciones > Webhooks) para recibir alertas"
        );
      }
    } catch (webhookError) {
      // Nunca propagar error al cliente
      console.error("[discord webhook] error al intentar notificar (ignorado):", webhookError);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/solicitudes", e);
    const msg = e instanceof Error ? e.message : "Error al crear solicitud";
    if (msg.includes("excede") || msg.includes("Extensión") || msg.includes("PDF") || msg.includes("fuente_definitiva")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg || "Error al crear solicitud" }, { status: 500 });
  }
}

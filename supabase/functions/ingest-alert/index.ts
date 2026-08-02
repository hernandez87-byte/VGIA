import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const hazardTypes = new Set([
  "flood",
  "fire",
  "earthquake",
  "hurricane",
  "chemical",
  "drought",
  "cosmic_impact",
  "infrastructure",
  "public_safety",
]);

interface AlertPayload {
  hazard?: string;
  title?: string;
  summary?: string;
  severity?: number;
  source_name?: string;
  source_url?: string;
  starts_at?: string;
  expires_at?: string;
  instructions?: string[];
  is_simulation?: boolean;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return json({ error: "Método no permitido." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Falta autorización." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return json({ error: "La función no tiene configuración completa." }, 500);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();

  if (userError || !userData.user) {
    return json({ error: "Sesión inválida." }, 401);
  }

  const role = userData.user.app_metadata?.role;
  if (role !== "operator" && role !== "admin") {
    return json({ error: "No tienes permiso para publicar alertas." }, 403);
  }

  let payload: AlertPayload;
  try {
    payload = (await request.json()) as AlertPayload;
  } catch {
    return json({ error: "El cuerpo debe ser JSON válido." }, 400);
  }

  const hazard = cleanText(payload.hazard, 40);
  const title = cleanText(payload.title, 160);
  const summary = cleanText(payload.summary, 2000);
  const sourceName = cleanText(payload.source_name, 160);
  const sourceUrl = cleanText(payload.source_url, 500) || null;
  const severity = Number(payload.severity);

  if (!hazardTypes.has(hazard)) {
    return json({ error: "Tipo de amenaza inválido." }, 400);
  }
  if (!title || !summary || !sourceName) {
    return json({ error: "Título, resumen y fuente son obligatorios." }, 400);
  }
  if (!Number.isInteger(severity) || severity < 0 || severity > 100) {
    return json({ error: "La severidad debe ser un entero entre 0 y 100." }, 400);
  }

  const startsAt = payload.starts_at ? new Date(payload.starts_at) : new Date();
  const expiresAt = payload.expires_at ? new Date(payload.expires_at) : null;

  if (Number.isNaN(startsAt.getTime()) || (expiresAt && Number.isNaN(expiresAt.getTime()))) {
    return json({ error: "Las fechas no son válidas." }, 400);
  }
  if (expiresAt && expiresAt <= startsAt) {
    return json({ error: "La expiración debe ser posterior al inicio." }, 400);
  }

  const instructions = Array.isArray(payload.instructions)
    ? payload.instructions
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 300))
        .filter(Boolean)
        .slice(0, 10)
    : [];

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await adminClient
    .from("emergency_events")
    .insert({
      hazard,
      title,
      summary,
      severity,
      verification: payload.is_simulation ? "verified" : "official",
      source_name: sourceName,
      source_url: sourceUrl,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt?.toISOString() ?? null,
      instructions,
      is_simulation: Boolean(payload.is_simulation),
    })
    .select("id, hazard, title, severity, verification, starts_at, expires_at, is_simulation")
    .single();

  if (error) {
    console.error("No se pudo guardar la alerta:", error);
    return json({ error: "No se pudo guardar la alerta." }, 500);
  }

  return json({ alert: data }, 201);
});

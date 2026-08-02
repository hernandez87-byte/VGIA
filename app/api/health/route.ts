import { NextResponse } from "next/server";
import { createClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json(
      {
        service: "vigia-web",
        status: "degraded",
        database: "not-configured",
        timestamp,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("active_events_public")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json(
      {
        service: "vigia-web",
        status: "ok",
        database: "connected",
        activeEvents: count ?? 0,
        timestamp,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Health check de Supabase falló:", error);
    return NextResponse.json(
      {
        service: "vigia-web",
        status: "degraded",
        database: "unreachable",
        timestamp,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

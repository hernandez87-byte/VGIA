import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

function parseCoordinate(value: string | null, min: number, max: number) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export async function GET(request: NextRequest) {
  const latitude = parseCoordinate(
    request.nextUrl.searchParams.get("lat"),
    -90,
    90,
  );
  const longitude = parseCoordinate(
    request.nextUrl.searchParams.get("lng"),
    -180,
    180,
  );
  const requestedRadius = Number(request.nextUrl.searchParams.get("radius") ?? 15000);
  const radius = Number.isFinite(requestedRadius)
    ? Math.min(Math.max(Math.round(requestedRadius), 100), 100000)
    : 15000;

  if (latitude === null || longitude === null) {
    return NextResponse.json(
      { error: "Los parámetros lat y lng son obligatorios y deben ser válidos." },
      { status: 400 },
    );
  }

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json(
      { error: "El servicio geoespacial no está configurado." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("nearby_resources", {
    user_latitude: latitude,
    user_longitude: longitude,
    radius_meters: radius,
    result_limit: 50,
  });

  if (error) {
    console.error("No se pudieron consultar recursos cercanos:", error);
    return NextResponse.json(
      { error: "No se pudieron consultar los recursos cercanos." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { latitude, longitude, radiusMeters: radius, resources: data ?? [] },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export const dynamic = "force-dynamic";

interface OpenMeteoGridResponse {
  latitude?: number;
  longitude?: number;
  elevation?: number;
  current?: {
    time?: string;
    temperature_2m?: number;
    surface_pressure?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
}

const GRID_LATITUDES = [25.54, 25.64, 25.74, 25.84];
const GRID_LONGITUDES = [-100.49, -100.38, -100.27, -100.16];

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function GET() {
  const coordinates = GRID_LATITUDES.flatMap((latitude) =>
    GRID_LONGITUDES.map((longitude) => ({ latitude, longitude })),
  );
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", coordinates.map((point) => point.latitude).join(","));
  endpoint.searchParams.set("longitude", coordinates.map((point) => point.longitude).join(","));
  endpoint.searchParams.set(
    "current",
    "temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m",
  );
  endpoint.searchParams.set("timezone", "America/Monterrey");

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return Response.json({ points: [], source: "unavailable" }, { status: 503 });
    }

    const payload = (await response.json()) as OpenMeteoGridResponse[] | OpenMeteoGridResponse;
    const rows = Array.isArray(payload) ? payload : [payload];
    const points = rows.flatMap((row, index) => {
      const coordinate = coordinates[index];
      const latitude = finiteNumber(row.latitude) ?? coordinate?.latitude ?? null;
      const longitude = finiteNumber(row.longitude) ?? coordinate?.longitude ?? null;
      if (latitude === null || longitude === null) return [];
      return [{
        id: `weather-${index}`,
        latitude,
        longitude,
        elevationM: finiteNumber(row.elevation),
        observedAt: row.current?.time ?? null,
        temperatureC: finiteNumber(row.current?.temperature_2m),
        surfacePressureHpa: finiteNumber(row.current?.surface_pressure),
        windKmh: finiteNumber(row.current?.wind_speed_10m),
        windDirectionDeg: finiteNumber(row.current?.wind_direction_10m),
      }];
    });

    return Response.json(
      {
        points,
        source: "Open-Meteo",
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      },
    );
  } catch {
    return Response.json({ points: [], source: "unavailable" }, { status: 503 });
  }
}

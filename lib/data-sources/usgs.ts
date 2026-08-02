import { fetchJson } from "@/lib/data-sources/http";
import type { LiveHazard, LiveSeverity } from "@/lib/data-sources/types";

const USGS_FEED =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

interface UsgsFeatureCollection {
  features: Array<{
    id: string;
    properties: {
      mag: number | null;
      place: string | null;
      time: number;
      updated: number;
      url: string;
      status: string;
      tsunami: number;
      type: string;
    };
    geometry: {
      type: "Point";
      coordinates: [number, number, number];
    };
  }>;
}

function severityForMagnitude(magnitude: number): LiveSeverity {
  if (magnitude >= 7) return "critical";
  if (magnitude >= 6) return "high";
  if (magnitude >= 4.5) return "moderate";
  return "low";
}

export async function getRecentEarthquakes(limit = 12): Promise<LiveHazard[]> {
  const data = await fetchJson<UsgsFeatureCollection>(
    "USGS",
    USGS_FEED,
    { next: { revalidate: 60, tags: ["usgs-earthquakes"] } },
  );

  return data.features.slice(0, limit).map((feature) => {
    const magnitude = feature.properties.mag ?? 0;
    const [longitude, latitude, depthKm] = feature.geometry.coordinates;
    const tsunamiNote = feature.properties.tsunami === 1 ? " Posible evaluación de tsunami." : "";

    return {
      id: `usgs:${feature.id}`,
      type: "earthquake",
      title: `Sismo M${magnitude.toFixed(1)} · ${feature.properties.place ?? "ubicación por confirmar"}`,
      summary: `Profundidad aproximada: ${depthKm.toFixed(1)} km. Estado USGS: ${feature.properties.status}.${tsunamiNote}`,
      severity: severityForMagnitude(magnitude),
      source: "USGS Earthquake Hazards Program",
      sourceKind: "official",
      occurredAt: new Date(feature.properties.time).toISOString(),
      updatedAt: new Date(feature.properties.updated).toISOString(),
      coordinates: { latitude, longitude },
      url: feature.properties.url,
    } satisfies LiveHazard;
  });
}

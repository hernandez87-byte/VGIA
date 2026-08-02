import { getOpenNaturalEvents } from "@/lib/data-sources/eonet";
import { getNearbyEmergencyResources } from "@/lib/data-sources/overpass";
import type {
  LiveHazard,
  LiveResource,
  LiveSnapshot,
  SourceHealth,
} from "@/lib/data-sources/types";
import { getRecentEarthquakes } from "@/lib/data-sources/usgs";

interface SourceResult<T> {
  items: T[];
  health: SourceHealth;
}

async function runSource<T>(
  id: string,
  label: string,
  sourceKind: SourceHealth["sourceKind"],
  loader: () => Promise<T[]>,
): Promise<SourceResult<T>> {
  const checkedAt = new Date().toISOString();

  try {
    const items = await loader();
    return {
      items,
      health: {
        id,
        label,
        sourceKind,
        status: "online",
        itemCount: items.length,
        checkedAt,
      },
    };
  } catch (error) {
    return {
      items: [],
      health: {
        id,
        label,
        sourceKind,
        status: "degraded",
        itemCount: 0,
        checkedAt,
        message: error instanceof Error ? error.message : "Error desconocido",
      },
    };
  }
}

export async function getLiveSnapshot(): Promise<LiveSnapshot> {
  const [earthquakes, naturalEvents, nearbyResources] = await Promise.all([
    runSource<LiveHazard>(
      "usgs",
      "USGS · Sismos",
      "official",
      () => getRecentEarthquakes(10),
    ),
    runSource<LiveHazard>(
      "eonet",
      "NASA EONET · Eventos naturales",
      "scientific",
      () => getOpenNaturalEvents(14),
    ),
    runSource<LiveResource>(
      "osm",
      "OpenStreetMap · Recursos de Monterrey",
      "community",
      () => getNearbyEmergencyResources(),
    ),
  ]);

  const hazards = [...earthquakes.items, ...naturalEvents.items].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );

  return {
    generatedAt: new Date().toISOString(),
    hazards,
    resources: nearbyResources.items,
    sources: [earthquakes.health, naturalEvents.health, nearbyResources.health],
  };
}

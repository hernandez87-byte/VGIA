import { fetchJson } from "@/lib/data-sources/http";
import type {
  LiveResource,
  LiveResourceCategory,
} from "@/lib/data-sources/types";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

interface OverpassResponse {
  elements: Array<{
    type: "node" | "way" | "relation";
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>;
}

function categoryFor(tags: Record<string, string>): LiveResourceCategory | null {
  if (tags.amenity === "hospital" || tags.amenity === "clinic") return "medical";
  if (tags.amenity === "pharmacy") return "pharmacy";
  if (tags.amenity === "fire_station") return "fire-station";
  if (tags.amenity === "shelter" || tags.social_facility === "shelter") return "shelter";
  if (tags.emergency === "drinking_water" || tags.man_made === "water_tower") return "water";
  if (tags.shop === "hardware") return "hardware";
  return null;
}

function fallbackName(category: LiveResourceCategory): string {
  const labels: Record<LiveResourceCategory, string> = {
    shelter: "Refugio registrado",
    medical: "Centro médico",
    pharmacy: "Farmacia",
    "fire-station": "Estación de bomberos",
    water: "Infraestructura de agua",
    hardware: "Ferretería",
  };

  return labels[category];
}

export async function getNearbyEmergencyResources(
  latitude = 25.6866,
  longitude = -100.3161,
  radiusMeters = 12_000,
  limit = 40,
): Promise<LiveResource[]> {
  const query = `[out:json][timeout:20];
(
  nwr(around:${radiusMeters},${latitude},${longitude})["amenity"~"hospital|clinic|pharmacy|fire_station|shelter"];
  nwr(around:${radiusMeters},${latitude},${longitude})["social_facility"="shelter"];
  nwr(around:${radiusMeters},${latitude},${longitude})["emergency"="drinking_water"];
  nwr(around:${radiusMeters},${latitude},${longitude})["man_made"="water_tower"];
  nwr(around:${radiusMeters},${latitude},${longitude})["shop"="hardware"];
);
out center tags;`;

  const data = await fetchJson<OverpassResponse>(
    "OpenStreetMap Overpass",
    OVERPASS_ENDPOINT,
    {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      next: { revalidate: 3_600, tags: ["osm-emergency-resources"] },
    },
    25_000,
  );

  return data.elements
    .map((element): LiveResource | null => {
      const tags = element.tags ?? {};
      const category = categoryFor(tags);
      const point =
        typeof element.lat === "number" && typeof element.lon === "number"
          ? { latitude: element.lat, longitude: element.lon }
          : element.center
            ? { latitude: element.center.lat, longitude: element.center.lon }
            : null;

      if (!category || !point) return null;

      return {
        id: `osm:${element.type}:${element.id}`,
        name: tags.name ?? fallbackName(category),
        category,
        source: "OpenStreetMap",
        sourceKind: "community",
        coordinates: point,
        status: "mapped",
        details:
          "Ubicación cartográfica comunitaria. Disponibilidad, acceso y operación no confirmados.",
      };
    })
    .filter((resource): resource is LiveResource => resource !== null)
    .slice(0, limit);
}

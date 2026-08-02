import { fetchJson } from "@/lib/data-sources/http";
import type { LiveHazard, LiveHazardType } from "@/lib/data-sources/types";

const EONET_EVENTS =
  "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=40&days=30";

interface EonetResponse {
  events: Array<{
    id: string;
    title: string;
    description?: string;
    link: string;
    categories: Array<{ id: string; title: string }>;
    sources: Array<{ id: string; url: string }>;
    geometry: Array<{
      date: string;
      type: string;
      coordinates: unknown;
    }>;
  }>;
}

function mapCategory(categoryId?: string): LiveHazardType {
  switch (categoryId) {
    case "wildfires":
      return "fire";
    case "floods":
      return "flood";
    case "severeStorms":
      return "storm";
    case "volcanoes":
      return "volcano";
    case "landslides":
      return "landslide";
    case "drought":
      return "drought";
    case "seaLakeIce":
      return "ice";
    default:
      return "other";
  }
}

function getPoint(geometry: EonetResponse["events"][number]["geometry"][number]) {
  if (
    geometry.type === "Point" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length >= 2 &&
    typeof geometry.coordinates[0] === "number" &&
    typeof geometry.coordinates[1] === "number"
  ) {
    return {
      longitude: geometry.coordinates[0],
      latitude: geometry.coordinates[1],
    };
  }

  return undefined;
}

export async function getOpenNaturalEvents(limit = 16): Promise<LiveHazard[]> {
  const data = await fetchJson<EonetResponse>(
    "NASA EONET",
    EONET_EVENTS,
    { next: { revalidate: 300, tags: ["nasa-eonet"] } },
  );

  return data.events.slice(0, limit).map((event) => {
    const latestGeometry = event.geometry.at(-1);
    const category = event.categories[0];
    const occurredAt = latestGeometry?.date ?? new Date().toISOString();

    return {
      id: `eonet:${event.id}`,
      type: mapCategory(category?.id),
      title: event.title,
      summary:
        event.description?.trim() ||
        `${category?.title ?? "Evento natural"} activo registrado por NASA EONET.`,
      severity: "unknown",
      source: "NASA EONET",
      sourceKind: "scientific",
      occurredAt,
      updatedAt: occurredAt,
      coordinates: latestGeometry ? getPoint(latestGeometry) : undefined,
      url: event.sources[0]?.url ?? event.link,
    } satisfies LiveHazard;
  });
}

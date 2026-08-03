export const dynamic = "force-dynamic";

type Geometry = {
  type: string;
  coordinates: unknown;
};

interface GeoFeature {
  type: "Feature";
  id?: string | number;
  geometry: Geometry | null;
  properties: Record<string, unknown>;
}

interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

interface OverpassElement {
  id?: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

const EMPTY_COLLECTION: GeoFeatureCollection = { type: "FeatureCollection", features: [] };
const MONTERREY_ENVELOPE = "-100.55,25.45,-100.05,25.95";
const FLOOD_SERVICE =
  "https://services9.arcgis.com/fp5f46XvVGKIUi0R/arcgis/rest/services/Capas_Monterrey_Inundaciones/FeatureServer";
const FLOOD_RETURN_2_LAYERS = [104, 113, 123, 132];

function validCollection(value: unknown): GeoFeatureCollection {
  if (
    value &&
    typeof value === "object" &&
    (value as { type?: unknown }).type === "FeatureCollection" &&
    Array.isArray((value as { features?: unknown }).features)
  ) {
    return value as GeoFeatureCollection;
  }
  return EMPTY_COLLECTION;
}

async function fetchJson(url: URL | string, revalidate: number): Promise<unknown> {
  const response = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(18_000),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  return response.json();
}

function arcGisQueryUrl(service: string, layer: number, fields: string): URL {
  const endpoint = new URL(`${service}/${layer}/query`);
  endpoint.searchParams.set("where", "1=1");
  endpoint.searchParams.set("outFields", fields);
  endpoint.searchParams.set("returnGeometry", "true");
  endpoint.searchParams.set("geometry", MONTERREY_ENVELOPE);
  endpoint.searchParams.set("geometryType", "esriGeometryEnvelope");
  endpoint.searchParams.set("inSR", "4326");
  endpoint.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  endpoint.searchParams.set("outSR", "4326");
  endpoint.searchParams.set("resultRecordCount", "1000");
  endpoint.searchParams.set("maxAllowableOffset", "0.00015");
  endpoint.searchParams.set("f", "geojson");
  return endpoint;
}

async function fetchFrequentFloodZones(): Promise<GeoFeatureCollection> {
  try {
    const responses = await Promise.all(
      FLOOD_RETURN_2_LAYERS.map(async (layer) => {
        const collection = validCollection(
          await fetchJson(
            arcGisQueryUrl(
              FLOOD_SERVICE,
              layer,
              "OBJECTID,PR,Tirante,Fuente,Metodolog,Fen_Clasif,Ame_Ampl",
            ),
            21_600,
          ),
        );
        return collection.features.map((feature) => ({
          ...feature,
          properties: { ...feature.properties, sourceLayer: layer, recurrenceYears: 2 },
        }));
      }),
    );
    return { type: "FeatureCollection", features: responses.flat().slice(0, 3500) };
  } catch {
    return EMPTY_COLLECTION;
  }
}

async function fetchHistoricalFloodReports(): Promise<GeoFeatureCollection> {
  const endpoint = new URL(
    "https://services9.arcgis.com/fp5f46XvVGKIUi0R/ArcGIS/rest/services/INUNDACION/FeatureServer/0/query",
  );
  endpoint.searchParams.set(
    "where",
    "Tipo_de_reporte IN ('Inundación','Encharcamiento','Desbordamiento Río')",
  );
  endpoint.searchParams.set(
    "outFields",
    "OBJECTID,Fecha_del_reporte,Tipo_de_reporte,Institucion_de_atencion",
  );
  endpoint.searchParams.set("returnGeometry", "true");
  endpoint.searchParams.set("geometry", MONTERREY_ENVELOPE);
  endpoint.searchParams.set("geometryType", "esriGeometryEnvelope");
  endpoint.searchParams.set("inSR", "4326");
  endpoint.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  endpoint.searchParams.set("outSR", "4326");
  endpoint.searchParams.set("resultRecordCount", "1000");
  endpoint.searchParams.set("f", "geojson");

  try {
    return validCollection(await fetchJson(endpoint, 3_600));
  } catch {
    return EMPTY_COLLECTION;
  }
}

async function fetchWaterways(): Promise<GeoFeatureCollection> {
  const query = `[out:json][timeout:18];way["waterway"~"^(river|stream|canal|drain)$"](25.45,-100.55,25.95,-100.05);out geom;`;
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return EMPTY_COLLECTION;
    const payload = (await response.json()) as { elements?: OverpassElement[] };
    const features: GeoFeature[] = (payload.elements ?? []).flatMap((element) => {
      const coordinates = element.geometry?.map((point) => [point.lon, point.lat]);
      if (!coordinates || coordinates.length < 2) return [];
      return [{
        type: "Feature" as const,
        id: element.id,
        geometry: { type: "LineString", coordinates },
        properties: {
          name: element.tags?.name ?? "Corriente sin nombre",
          waterway: element.tags?.waterway ?? "stream",
          intermittent: element.tags?.intermittent === "yes",
          source: "OpenStreetMap",
        },
      }];
    });
    return { type: "FeatureCollection", features: features.slice(0, 900) };
  } catch {
    return EMPTY_COLLECTION;
  }
}

async function fetchSeismicHistory(): Promise<GeoFeatureCollection> {
  const endpoint = new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
  endpoint.searchParams.set("format", "geojson");
  endpoint.searchParams.set("starttime", "2006-01-01");
  endpoint.searchParams.set("minlatitude", "22");
  endpoint.searchParams.set("maxlatitude", "30");
  endpoint.searchParams.set("minlongitude", "-104.5");
  endpoint.searchParams.set("maxlongitude", "-96");
  endpoint.searchParams.set("minmagnitude", "2.5");
  endpoint.searchParams.set("orderby", "time");
  endpoint.searchParams.set("limit", "1000");

  try {
    return validCollection(await fetchJson(endpoint, 3_600));
  } catch {
    return EMPTY_COLLECTION;
  }
}

export async function GET() {
  const [frequentFlood, historicalFlood, waterways, seismic] = await Promise.all([
    fetchFrequentFloodZones(),
    fetchHistoricalFloodReports(),
    fetchWaterways(),
    fetchSeismicHistory(),
  ]);

  return Response.json(
    {
      frequentFlood,
      historicalFlood,
      waterways,
      seismic,
      generatedAt: new Date().toISOString(),
      sources: {
        frequentFlood: "Atlas de Riesgos de Monterrey · periodo de retorno 2 años",
        historicalFlood: "Servicio geográfico de reportes de inundación",
        waterways: "OpenStreetMap · red hidrográfica colaborativa",
        seismic: "USGS Earthquake Catalog · actividad histórica regional",
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600",
      },
    },
  );
}

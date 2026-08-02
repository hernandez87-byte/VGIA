import type {
  ConfidenceLevel,
  DashboardData,
  EmergencyEvent,
  GeoJsonGeometry,
  HazardType,
  HazardZone,
  RecommendedAction,
  ResourcePoint,
  RiskLevel,
  RoadClosure,
} from "@/lib/domain/emergency";
import {
  activeEvent as fallbackEvent,
  hazardZones as fallbackHazardZones,
  resources as fallbackResources,
  roadClosures as fallbackRoadClosures,
} from "@/lib/mock-data";
import {
  createClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";

const DEFAULT_LATITUDE = Number(
  process.env.NEXT_PUBLIC_DEFAULT_LATITUDE ?? "25.6866",
);
const DEFAULT_LONGITUDE = Number(
  process.env.NEXT_PUBLIC_DEFAULT_LONGITUDE ?? "-100.3161",
);

type EventRow = {
  id: string;
  hazard: HazardType;
  title: string;
  summary: string;
  severity: number;
  verification: ConfidenceLevel;
  source_name: string;
  source_url: string | null;
  starts_at: string;
  expires_at: string | null;
  is_simulation: boolean;
  instructions: unknown;
  affected_area: GeoJsonGeometry | null;
};

type ResourceRow = {
  id: string;
  category: ResourcePoint["category"];
  name: string;
  description: string | null;
  address: string | null;
  status: ResourcePoint["status"];
  verification: ConfidenceLevel;
  capacity: number | null;
  capacity_unit: string | null;
  is_simulation: boolean;
  metadata: Record<string, unknown> | null;
  last_verified_at: string | null;
  latitude: number | null;
  longitude: number | null;
};

type HazardZoneRow = {
  id: string;
  event_id: string;
  risk_score: number;
  expected_depth_m: number | null;
  expected_arrival_at: string | null;
  geometry: GeoJsonGeometry | null;
  properties: Record<string, unknown> | null;
};

type RoadClosureRow = {
  id: string;
  event_id: string | null;
  reason: string;
  verification: ConfidenceLevel;
  geometry: GeoJsonGeometry | null;
  is_simulation: boolean;
};

function riskLevelFromSeverity(severity: number): RiskLevel {
  if (severity >= 80) return "critical";
  if (severity >= 60) return "high";
  if (severity >= 30) return "moderate";
  return "low";
}

function actionForHazard(
  hazard: HazardType,
  severity: number,
): RecommendedAction {
  if (severity < 30) return "monitor";
  if (severity < 60) return "prepare";

  switch (hazard) {
    case "flood":
      return "move-up";
    case "fire":
    case "hurricane":
      return "evacuate";
    case "chemical":
      return "seal-building";
    case "earthquake":
      return "shelter";
    case "public_safety":
      return "avoid-area";
    default:
      return "prepare";
  }
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Monterrey",
  }).format(new Date(value));
}

function minutesSince(value: string | null): number {
  if (!value) return 0;
  return Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );
}

function distanceKm(
  latitude: number | null,
  longitude: number | null,
): number {
  if (latitude === null || longitude === null) return 0;

  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = toRadians(latitude - DEFAULT_LATITUDE);
  const deltaLongitude = toRadians(longitude - DEFAULT_LONGITUDE);
  const startLatitude = toRadians(DEFAULT_LATITUDE);
  const endLatitude = toRadians(latitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) ** 2;

  return Number(
    (earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1),
  );
}

function normalizeInstructions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function resourceDetails(resource: ResourceRow): string {
  const capacity =
    resource.capacity !== null && resource.capacity_unit
      ? `${resource.capacity} ${resource.capacity_unit}`
      : null;

  return [resource.description, capacity, resource.address]
    .filter(Boolean)
    .join(" · ");
}

function fallback(): DashboardData {
  return {
    event: fallbackEvent,
    resources: fallbackResources,
    hazardZones: fallbackHazardZones,
    roadClosures: fallbackRoadClosures,
    source: "fallback",
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!hasSupabaseServerConfig()) return fallback();

  try {
    const supabase = await createClient();
    const [eventResult, resourceResult, zoneResult, closureResult] =
      await Promise.all([
        supabase
          .from("active_events_public")
          .select("*")
          .order("severity", { ascending: false })
          .order("starts_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("public_resources_public")
          .select("*")
          .neq("status", "closed")
          .limit(30),
        supabase.from("active_hazard_zones_public").select("*").limit(100),
        supabase.from("active_road_closures_public").select("*").limit(100),
      ]);

    if (eventResult.error || !eventResult.data) {
      throw eventResult.error ?? new Error("No hay eventos activos disponibles.");
    }
    if (resourceResult.error) throw resourceResult.error;
    if (zoneResult.error) throw zoneResult.error;
    if (closureResult.error) throw closureResult.error;

    const row = eventResult.data as EventRow;
    const event: EmergencyEvent = {
      id: row.id,
      type: row.hazard,
      title: row.title,
      summary: row.summary,
      severity: row.severity,
      riskLevel: riskLevelFromSeverity(row.severity),
      confidence: row.verification,
      action: actionForHazard(row.hazard, row.severity),
      updatedAt: formatTime(row.starts_at),
      updatedAtIso: row.starts_at,
      source: row.source_name,
      sourceUrl: row.source_url ?? undefined,
      isSimulation: row.is_simulation,
      instructions: normalizeInstructions(row.instructions),
      affectedArea: row.affected_area ?? undefined,
    };

    const resources = ((resourceResult.data ?? []) as ResourceRow[])
      .map<ResourcePoint>((resource) => ({
        id: resource.id,
        name: resource.name,
        category: resource.category,
        status: resource.status,
        distanceKm: distanceKm(resource.latitude, resource.longitude),
        updatedMinutesAgo: minutesSince(resource.last_verified_at),
        details: resourceDetails(resource),
        latitude: resource.latitude ?? undefined,
        longitude: resource.longitude ?? undefined,
        isSimulation: resource.is_simulation,
        metadata: resource.metadata ?? {},
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm);

    const hazardZones = ((zoneResult.data ?? []) as HazardZoneRow[])
      .filter(
        (zone): zone is HazardZoneRow & { geometry: GeoJsonGeometry } =>
          zone.event_id === event.id && zone.geometry !== null,
      )
      .map<HazardZone>((zone) => ({
        id: zone.id,
        eventId: zone.event_id,
        riskScore: zone.risk_score,
        expectedDepthM: zone.expected_depth_m ?? undefined,
        expectedArrivalAt: zone.expected_arrival_at ?? undefined,
        geometry: zone.geometry,
        properties: zone.properties ?? {},
      }));

    const roadClosures = ((closureResult.data ?? []) as RoadClosureRow[])
      .filter(
        (closure): closure is RoadClosureRow & { geometry: GeoJsonGeometry } =>
          closure.geometry !== null &&
          (!closure.event_id || closure.event_id === event.id),
      )
      .map<RoadClosure>((closure) => ({
        id: closure.id,
        eventId: closure.event_id ?? undefined,
        reason: closure.reason,
        confidence: closure.verification,
        geometry: closure.geometry,
        isSimulation: closure.is_simulation,
      }));

    return {
      event,
      resources,
      hazardZones,
      roadClosures,
      source: "supabase",
    };
  } catch (error) {
    console.error("VIGÍA no pudo cargar el tablero en vivo:", error);
    return fallback();
  }
}

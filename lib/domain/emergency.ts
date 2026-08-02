export const hazardTypes = [
  "flood",
  "fire",
  "earthquake",
  "hurricane",
  "chemical",
  "drought",
  "cosmic_impact",
  "infrastructure",
  "public_safety",
] as const;

export type HazardType = (typeof hazardTypes)[number];
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type ConfidenceLevel =
  | "official"
  | "verified"
  | "corroborated"
  | "unverified";
export type RecommendedAction =
  | "monitor"
  | "prepare"
  | "shelter"
  | "evacuate"
  | "move-up"
  | "avoid-area"
  | "seal-building";
export type ResourceCategory =
  | "shelter"
  | "water"
  | "medical"
  | "food"
  | "energy"
  | "hardware"
  | "communications";

export interface GeoJsonGeometry {
  type: "Point" | "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon";
  coordinates: unknown;
}

export interface EmergencyEvent {
  id: string;
  type: HazardType;
  title: string;
  summary: string;
  severity: number;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  action: RecommendedAction;
  updatedAt: string;
  updatedAtIso: string;
  source: string;
  sourceUrl?: string;
  isSimulation: boolean;
  instructions: string[];
  affectedArea?: GeoJsonGeometry;
}

export interface ResourcePoint {
  id: string;
  name: string;
  category: ResourceCategory;
  status: "available" | "limited" | "closed" | "unknown";
  distanceKm: number;
  updatedMinutesAgo: number;
  details: string;
  latitude?: number;
  longitude?: number;
  isSimulation: boolean;
  metadata: Record<string, unknown>;
}

export interface HazardZone {
  id: string;
  eventId: string;
  riskScore: number;
  expectedDepthM?: number;
  expectedArrivalAt?: string;
  geometry: GeoJsonGeometry;
  properties: Record<string, unknown>;
}

export interface RoadClosure {
  id: string;
  eventId?: string;
  reason: string;
  confidence: ConfidenceLevel;
  geometry: GeoJsonGeometry;
  isSimulation: boolean;
}

export interface FamilyMemberStatus {
  id: string;
  name: string;
  status: "safe" | "moving" | "needs-help" | "unknown";
  locationLabel: string;
  updatedMinutesAgo: number;
}

export interface DashboardData {
  event: EmergencyEvent;
  resources: ResourcePoint[];
  hazardZones: HazardZone[];
  roadClosures: RoadClosure[];
  source: "supabase" | "fallback";
}

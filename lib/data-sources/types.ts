export type LiveHazardType =
  | "earthquake"
  | "fire"
  | "flood"
  | "storm"
  | "volcano"
  | "landslide"
  | "drought"
  | "ice"
  | "other";

export type LiveSeverity = "low" | "moderate" | "high" | "critical" | "unknown";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LiveHazard {
  id: string;
  type: LiveHazardType;
  title: string;
  summary: string;
  severity: LiveSeverity;
  source: string;
  sourceKind: "official" | "scientific" | "community";
  occurredAt: string;
  updatedAt: string;
  coordinates?: Coordinates;
  url?: string;
}

export type LiveResourceCategory =
  | "shelter"
  | "medical"
  | "pharmacy"
  | "fire-station"
  | "water"
  | "hardware";

export interface LiveResource {
  id: string;
  name: string;
  category: LiveResourceCategory;
  source: string;
  sourceKind: "official" | "community";
  coordinates: Coordinates;
  status: "mapped" | "verified";
  details: string;
}

export interface SourceHealth {
  id: string;
  label: string;
  status: "online" | "degraded";
  sourceKind: "official" | "scientific" | "community";
  itemCount: number;
  checkedAt: string;
  message?: string;
}

export interface LiveSnapshot {
  generatedAt: string;
  hazards: LiveHazard[];
  resources: LiveResource[];
  sources: SourceHealth[];
}

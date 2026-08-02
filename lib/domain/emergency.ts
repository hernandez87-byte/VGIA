export const hazardTypes = [
  "flood",
  "fire",
  "earthquake",
  "hurricane",
  "chemical",
  "drought",
  "cosmic-impact",
  "infrastructure",
  "public-safety",
] as const;

export type HazardType = (typeof hazardTypes)[number];

export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type ConfidenceLevel = "official" | "verified" | "probable" | "unverified";
export type RecommendedAction =
  | "monitor"
  | "prepare"
  | "shelter"
  | "evacuate"
  | "move-up"
  | "avoid-area"
  | "seal-building";

export interface EmergencyEvent {
  id: string;
  type: HazardType;
  title: string;
  summary: string;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  action: RecommendedAction;
  updatedAt: string;
  source: string;
}

export interface ResourcePoint {
  id: string;
  name: string;
  category: "shelter" | "water" | "medical" | "food" | "energy" | "hardware";
  status: "available" | "limited" | "closed" | "unknown";
  distanceKm: number;
  updatedMinutesAgo: number;
  details: string;
}

export interface FamilyMemberStatus {
  id: string;
  name: string;
  status: "safe" | "moving" | "needs-help" | "unknown";
  locationLabel: string;
  updatedMinutesAgo: number;
}

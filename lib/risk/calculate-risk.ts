import type { RecommendedAction, RiskLevel } from "@/lib/domain/emergency";

export interface RiskInput {
  hazardIntensity: number;
  personalExposure: number;
  structuralVulnerability: number;
  cascadingHazards: number;
  routeAvailability: number;
  officialEvacuationOrder?: boolean;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  action: RecommendedAction;
  explanation: string[];
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function calculateRisk(input: RiskInput): RiskAssessment {
  const intensity = clamp(input.hazardIntensity);
  const exposure = clamp(input.personalExposure);
  const vulnerability = clamp(input.structuralVulnerability);
  const cascading = clamp(input.cascadingHazards);
  const routePenalty = 100 - clamp(input.routeAvailability);

  const weightedScore =
    intensity * 0.32 +
    exposure * 0.27 +
    vulnerability * 0.18 +
    cascading * 0.13 +
    routePenalty * 0.1 +
    (input.officialEvacuationOrder ? 18 : 0);

  const score = Math.round(clamp(weightedScore));
  const level: RiskLevel =
    score >= 80 ? "critical" : score >= 60 ? "high" : score >= 35 ? "moderate" : "low";

  const action: RecommendedAction = input.officialEvacuationOrder
    ? "evacuate"
    : score >= 80
      ? "evacuate"
      : score >= 60
        ? "prepare"
        : score >= 35
          ? "monitor"
          : "monitor";

  const explanation = [
    `Intensidad de amenaza: ${intensity}/100`,
    `Exposición personal: ${exposure}/100`,
    `Vulnerabilidad: ${vulnerability}/100`,
    `Riesgos secundarios: ${cascading}/100`,
    `Disponibilidad de rutas: ${clamp(input.routeAvailability)}/100`,
  ];

  if (input.officialEvacuationOrder) {
    explanation.unshift("Existe una orden oficial de evacuación activa.");
  }

  return { score, level, action, explanation };
}

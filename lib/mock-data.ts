import type { EmergencyEvent, FamilyMemberStatus, ResourcePoint } from "@/lib/domain/emergency";

export const activeEvent: EmergencyEvent = {
  id: "event-demo-flood-001",
  type: "flood",
  title: "Inundación repentina en zona poniente",
  summary:
    "El arroyo presenta crecimiento acelerado. Dos pasos deprimidos ya fueron cerrados.",
  riskLevel: "critical",
  confidence: "official",
  action: "evacuate",
  updatedAt: "12:14",
  source: "Demostración de Protección Civil",
};

export const resources: ResourcePoint[] = [
  {
    id: "resource-1",
    name: "Secundaria 18",
    category: "shelter",
    status: "available",
    distanceKm: 1.7,
    updatedMinutesAgo: 4,
    details: "86 espacios, agua, baños y atención básica.",
  },
  {
    id: "resource-2",
    name: "Centro de salud Mitras",
    category: "medical",
    status: "limited",
    distanceKm: 2.3,
    updatedMinutesAgo: 9,
    details: "Urgencias operando; acceso únicamente por avenida norte.",
  },
  {
    id: "resource-3",
    name: "Purificadora Norte",
    category: "water",
    status: "available",
    distanceKm: 2.8,
    updatedMinutesAgo: 7,
    details: "Agua potable confirmada; máximo dos garrafones por familia.",
  },
];

export const familyStatuses: FamilyMemberStatus[] = [
  {
    id: "family-1",
    name: "Eusebio",
    status: "moving",
    locationLabel: "Ruta al refugio",
    updatedMinutesAgo: 1,
  },
  {
    id: "family-2",
    name: "Alex",
    status: "safe",
    locationLabel: "Escuela confirmada",
    updatedMinutesAgo: 3,
  },
  {
    id: "family-3",
    name: "Emilio",
    status: "unknown",
    locationLabel: "Sin confirmación",
    updatedMinutesAgo: 18,
  },
];

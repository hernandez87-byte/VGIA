import type {
  EmergencyEvent,
  FamilyMemberStatus,
  HazardZone,
  ResourcePoint,
  RoadClosure,
} from "@/lib/domain/emergency";

export const activeEvent: EmergencyEvent = {
  id: "event-demo-flood-001",
  type: "flood",
  title: "Modo local: escenario de inundación",
  summary:
    "Supabase no está disponible. Se muestran datos locales exclusivamente para validar la interfaz.",
  severity: 72,
  riskLevel: "high",
  confidence: "unverified",
  action: "prepare",
  updatedAt: "sin conexión",
  updatedAtIso: new Date(0).toISOString(),
  source: "Fallback local de VIGÍA",
  isSimulation: true,
  instructions: [
    "No uses esta demostración para tomar decisiones reales.",
    "Consulta indicaciones oficiales de Protección Civil.",
  ],
};

export const resources: ResourcePoint[] = [
  {
    id: "resource-local-1",
    name: "Recurso local de demostración",
    category: "shelter",
    status: "unknown",
    distanceKm: 0,
    updatedMinutesAgo: 0,
    details: "Sin conexión con la base de datos. Disponibilidad no confirmada.",
    latitude: 25.6866,
    longitude: -100.3161,
    isSimulation: true,
    metadata: {},
  },
];

export const hazardZones: HazardZone[] = [];
export const roadClosures: RoadClosure[] = [];

export const familyStatuses: FamilyMemberStatus[] = [
  {
    id: "family-1",
    name: "Usuario",
    status: "unknown",
    locationLabel: "Inicia sesión para configurar tu grupo",
    updatedMinutesAgo: 0,
  },
];

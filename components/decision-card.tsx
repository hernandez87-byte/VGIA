import type {
  EmergencyEvent,
  RecommendedAction,
  RiskLevel,
} from "@/lib/domain/emergency";
import { StatusChip } from "@/components/status-chip";

interface DecisionCardProps {
  event: EmergencyEvent;
}

const actionTitle: Record<RecommendedAction, string> = {
  monitor: "Mantente atento a nuevas indicaciones",
  prepare: "Prepara tu salida y suministros",
  shelter: "Protégete donde estás",
  evacuate: "Evacúa cuando la autoridad lo indique",
  "move-up": "Aléjate del agua y busca una zona alta",
  "avoid-area": "Evita la zona afectada",
  "seal-building": "Cierra y sella el inmueble",
};

const riskLabel: Record<RiskLevel, string> = {
  low: "Riesgo bajo",
  moderate: "Riesgo moderado",
  high: "Riesgo alto",
  critical: "Riesgo crítico",
};

export function DecisionCard({ event }: DecisionCardProps) {
  const tone =
    event.riskLevel === "critical" || event.riskLevel === "high"
      ? "danger"
      : event.riskLevel === "moderate"
        ? "warning"
        : "success";

  return (
    <article className="decision-card">
      <div className="decision-topline">
        <StatusChip tone={tone}>{riskLabel[event.riskLevel]}</StatusChip>
        <span className="freshness">Actualizado {event.updatedAt}</span>
      </div>

      <span className="eyebrow">Tu decisión ahora</span>
      <h1>{actionTitle[event.action]}</h1>
      <p className="decision-summary">{event.summary}</p>

      <div className="time-window">
        <span className="time-icon" aria-hidden="true">◷</span>
        <div>
          <strong>Severidad estimada: {event.severity}/100</strong>
          <span>
            {event.instructions[0] ??
              "Espera instrucciones verificadas antes de desplazarte."}
          </span>
        </div>
      </div>

      <div className="decision-actions">
        <a className="primary-button" href="#mapa-operativo">
          Ver mapa operativo
        </a>
        <a className="secondary-button" href="tel:911">
          Llamar al 911
        </a>
      </div>

      <div className="source-line">
        <span className="verified-dot" />
        <span>{event.source}</span>
        <strong>
          {event.isSimulation ? "Simulación" : event.confidence}
        </strong>
      </div>
    </article>
  );
}

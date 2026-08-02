import Link from "next/link";
import type {
  EmergencyEvent,
  HazardType,
  RecommendedAction,
  RiskLevel,
} from "@/lib/domain/emergency";
import { StatusChip } from "@/components/status-chip";

interface DecisionCardProps {
  event: EmergencyEvent;
}

const actionTitle: Record<RecommendedAction, string> = {
  monitor: "Mantente atento a nuevas indicaciones",
  prepare: "Prepara tu salida y tus suministros",
  shelter: "Protégete donde estás",
  evacuate: "Evacúa cuando la autoridad lo indique",
  "move-up": "Aléjate del agua y busca una zona alta",
  "avoid-area": "Evita la zona afectada",
  "seal-building": "Cierra y sella el inmueble",
};

const actionButton: Record<RecommendedAction, string> = {
  monitor: "Revisar zona y avisos",
  prepare: "Preparar salida",
  shelter: "Ver zona de resguardo",
  evacuate: "Revisar evacuación",
  "move-up": "Buscar zona segura",
  "avoid-area": "Ver zona que debes evitar",
  "seal-building": "Ver instrucciones de resguardo",
};

const hazardLabel: Record<HazardType, string> = {
  flood: "Inundación",
  fire: "Incendio",
  earthquake: "Sismo",
  hurricane: "Huracán",
  chemical: "Riesgo químico",
  drought: "Sequía",
  cosmic_impact: "Impacto cósmico",
  infrastructure: "Infraestructura",
  public_safety: "Seguridad y movilidad",
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
    <article className={`decision-card decision-card-${tone}`}>
      <div className="decision-topline">
        <StatusChip tone={tone}>{riskLabel[event.riskLevel]}</StatusChip>
        <span className="freshness">Actualizado {event.updatedAt}</span>
      </div>

      <span className="eyebrow">{hazardLabel[event.type]} · tu decisión ahora</span>
      <h1>{actionTitle[event.action]}</h1>
      <p className="decision-summary">{event.summary}</p>

      <div className="decision-priority">
        <div>
          <span>Acción prioritaria</span>
          <strong>
            {event.instructions[0] ??
              "Espera instrucciones verificadas antes de desplazarte."}
          </strong>
        </div>
        <b>{event.severity}/100</b>
      </div>

      <div className="severity-track" aria-label={`Severidad ${event.severity} de 100`}>
        <span style={{ width: `${Math.max(0, Math.min(100, event.severity))}%` }} />
      </div>

      <div className="decision-actions">
        <a className="primary-button" href="#mapa-operativo">
          {actionButton[event.action]}
        </a>
        <Link className="secondary-button" href="/familia">
          Estoy a salvo
        </Link>
      </div>

      <a className="emergency-call-link" href="tel:911">
        Emergencia inmediata: llamar al 911
      </a>

      <details className="decision-explanation">
        <summary>Ver por qué recibí esta recomendación</summary>
        <div>
          <p>
            Severidad estimada: <strong>{event.severity}/100</strong>. Fuente: {event.source}.
          </p>
          {event.instructions.slice(1).map((instruction) => (
            <p key={instruction}>{instruction}</p>
          ))}
          <p>
            {event.isSimulation
              ? "Este escenario es una demostración y no representa una emergencia real."
              : "La recomendación complementa, pero no sustituye, las indicaciones oficiales."}
          </p>
        </div>
      </details>

      <div className="source-line">
        <span className="verified-dot" />
        <span>{event.source}</span>
        <strong>{event.isSimulation ? "Simulación" : event.confidence}</strong>
      </div>
    </article>
  );
}

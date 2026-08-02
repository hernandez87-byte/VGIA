import type { EmergencyEvent } from "@/lib/domain/emergency";
import { StatusChip } from "@/components/status-chip";

interface DecisionCardProps {
  event: EmergencyEvent;
}

export function DecisionCard({ event }: DecisionCardProps) {
  return (
    <article className="decision-card">
      <div className="decision-topline">
        <StatusChip tone="danger">Riesgo crítico</StatusChip>
        <span className="freshness">Actualizado {event.updatedAt}</span>
      </div>

      <span className="eyebrow">Tu decisión ahora</span>
      <h1>Evacúa por la ruta norte</h1>
      <p className="decision-summary">{event.summary}</p>

      <div className="time-window">
        <span className="time-icon" aria-hidden="true">◷</span>
        <div>
          <strong>22 minutos de ventana estimada</strong>
          <span>La ruta puede quedar bloqueada después.</span>
        </div>
      </div>

      <div className="decision-actions">
        <button className="primary-button" type="button">Iniciar ruta segura</button>
        <button className="secondary-button" type="button">Necesito ayuda</button>
      </div>

      <div className="source-line">
        <span className="verified-dot" />
        <span>{event.source}</span>
        <strong>Fuente oficial</strong>
      </div>
    </article>
  );
}

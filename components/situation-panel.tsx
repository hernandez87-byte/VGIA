import Link from "next/link";
import type { CityStatus } from "@/lib/data/city-status";
import type { LocalNewsItem } from "@/lib/news/local-news";

interface SituationPanelProps {
  status: CityStatus;
  incidentCount: number;
  roadClosureCount: number;
  resourceCount: number;
  hazardZoneCount: number;
  latestIncidents: LocalNewsItem[];
}

function lineState(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function stateTone(value: number, dangerAt = 2): "ok" | "warn" | "danger" {
  if (value <= 0) return "ok";
  if (value >= dangerAt) return "danger";
  return "warn";
}

function airTone(aqi: number | null): "ok" | "warn" | "danger" | "neutral" {
  if (aqi === null) return "neutral";
  if (aqi <= 50) return "ok";
  if (aqi <= 100) return "warn";
  return "danger";
}

function runoffTone(status: CityStatus): "ok" | "warn" | "danger" {
  const probability = status.rainProbability ?? 0;
  const current = status.precipitationMm ?? 0;
  if (probability >= 70 || current >= 8) return "danger";
  if (probability >= 40 || current >= 2) return "warn";
  return "ok";
}

function runoffLabel(status: CityStatus): string {
  const tone = runoffTone(status);
  if (tone === "danger") return "Alto";
  if (tone === "warn") return "Vigilancia";
  return "Bajo";
}

export function SituationPanel({
  status,
  incidentCount,
  roadClosureCount,
  resourceCount,
  hazardZoneCount,
  latestIncidents,
}: SituationPanelProps) {
  return (
    <aside className="situation-panel situation-panel-compact" aria-labelledby="situation-title">
      <div className="situation-heading">
        <div>
          <span className="eyebrow">Situación operativa</span>
          <h2 id="situation-title">Monterrey ahora</h2>
        </div>
        <span className="situation-pulse" aria-label="Actualización activa" />
      </div>

      <div className="situation-primary-state">
        <span className={`signal-dot signal-${stateTone(incidentCount, 3)}`} />
        <div>
          <strong>{incidentCount > 0 ? lineState(incidentCount, "aviso reciente", "avisos recientes") : "Sin avisos críticos recientes"}</strong>
          <small>Ventana automática de 72 horas</small>
        </div>
      </div>

      <ul className="situation-list situation-list-signals">
        <li>
          <span><i className={`signal-dot signal-${stateTone(roadClosureCount, 3)}`} />Cierres viales</span>
          <strong>{roadClosureCount}</strong>
        </li>
        <li>
          <span><i className={`signal-dot signal-${stateTone(hazardZoneCount, 2)}`} />Zonas de riesgo trazadas</span>
          <strong>{hazardZoneCount}</strong>
        </li>
        <li>
          <span><i className={`signal-dot signal-${runoffTone(status)}`} />Escurrimiento pluvial</span>
          <strong>{runoffLabel(status)}</strong>
        </li>
        <li>
          <span><i className="signal-dot signal-ok" />Recursos visibles</span>
          <strong>{resourceCount}</strong>
        </li>
        <li>
          <span><i className={`signal-dot signal-${airTone(status.usAqi)}`} />Calidad del aire</span>
          <strong>{status.airQualityLabel}</strong>
        </li>
      </ul>

      {latestIncidents.length > 0 ? (
        <div className="situation-incidents situation-incidents-compact">
          <div className="situation-incidents-heading">
            <strong>Última hora</strong>
            <Link href="/avisos">Ver todos</Link>
          </div>
          {latestIncidents.slice(0, 2).map((incident) => (
            <a
              key={incident.id}
              href={incident.url}
              target="_blank"
              rel="noopener noreferrer"
              className="situation-incident"
            >
              <span>{incident.category}</span>
              <strong>{incident.title}</strong>
            </a>
          ))}
        </div>
      ) : null}

      <div className="situation-actions">
        <Link href="/avisos">Ver avisos</Link>
        <Link href="/reportar">Reportar</Link>
      </div>

      <p className="situation-note">
        Próxima revisión aproximada: {status.nextUpdateLabel}. Las órdenes de evacuación solo provienen de autoridades competentes.
      </p>
    </aside>
  );
}

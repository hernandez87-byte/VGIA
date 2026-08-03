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

export function SituationPanel({
  status,
  incidentCount,
  roadClosureCount,
  resourceCount,
  hazardZoneCount,
  latestIncidents,
}: SituationPanelProps) {
  return (
    <aside className="situation-panel" aria-labelledby="situation-title">
      <div className="situation-heading">
        <div>
          <span className="eyebrow">Resumen operativo</span>
          <h2 id="situation-title">Ahora en Monterrey</h2>
        </div>
        <span className="situation-pulse" aria-label="Actualización activa" />
      </div>

      <div className="situation-weather">
        <span aria-hidden="true">{status.weatherIcon}</span>
        <div>
          <strong>
            {status.temperatureC === null ? "Sin lectura" : `${Math.round(status.temperatureC)} °C`}
          </strong>
          <small>
            {status.weatherLabel} · Sensación {status.apparentTemperatureC === null
              ? "—"
              : `${Math.round(status.apparentTemperatureC)} °C`}
          </small>
        </div>
      </div>

      <div className="rain-outlook" aria-label="Probabilidad de lluvia próximas seis horas">
        <div className="rain-outlook-heading">
          <strong>Lluvia próximas 6 horas</strong>
          <span>{status.rainProbability === null ? "—" : `${Math.round(status.rainProbability)} % hoy`}</span>
        </div>
        {status.hourlyRain.length > 0 ? (
          <div className="rain-bars">
            {status.hourlyRain.map((point) => (
              <div className="rain-bar" key={point.time}>
                <span>{point.probability}%</span>
                <i style={{ height: `${Math.max(8, point.probability)}%` }} />
                <small>{point.label}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="rain-unavailable">Pronóstico horario no disponible.</p>
        )}
      </div>

      <ul className="situation-list situation-list-signals">
        <li>
          <span><i className={`signal-dot signal-${stateTone(incidentCount, 3)}`} />Incidentes recientes</span>
          <strong>{lineState(incidentCount, "aviso", "avisos")}</strong>
        </li>
        <li>
          <span><i className={`signal-dot signal-${stateTone(roadClosureCount, 3)}`} />Cierres viales</span>
          <strong>{roadClosureCount}</strong>
        </li>
        <li>
          <span><i className={`signal-dot signal-${stateTone(hazardZoneCount, 2)}`} />Zonas de riesgo</span>
          <strong>{hazardZoneCount}</strong>
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

      <div className="situation-incidents">
        <div className="situation-incidents-heading">
          <strong>Últimos avisos</strong>
          <Link href="/avisos">Ver todos</Link>
        </div>
        {latestIncidents.length > 0 ? (
          latestIncidents.map((incident) => (
            <a
              key={incident.id}
              href={incident.url}
              target="_blank"
              rel="noopener noreferrer"
              className="situation-incident"
            >
              <span>{incident.category}</span>
              <strong>{incident.title}</strong>
              <small>{incident.publishedLabel ?? incident.sourceName}</small>
            </a>
          ))
        ) : (
          <p className="situation-no-incidents">Sin avisos operativos recientes.</p>
        )}
      </div>

      <div className="situation-actions">
        <Link href="/avisos">Ver incidentes</Link>
        <Link href="/reportar">Reportar</Link>
      </div>

      <p className="situation-note">
        Próxima actualización aproximada: {status.nextUpdateLabel}. El clima y el aire son datos modelados; las órdenes de evacuación solo provienen de autoridades competentes.
      </p>
    </aside>
  );
}

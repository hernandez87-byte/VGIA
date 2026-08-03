import type { CityStatus } from "@/lib/data/city-status";

interface MetropolitanStatusProps {
  status: CityStatus;
  incidentCount: number;
  roadClosureCount: number;
  resourceCount: number;
  hazardZoneCount: number;
}

function metric(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${Math.round(value)}${suffix}`;
}

function aqiTone(aqi: number | null): string {
  if (aqi === null) return "neutral";
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  return "danger";
}

export function MetropolitanStatus({
  status,
  incidentCount,
  roadClosureCount,
  resourceCount,
  hazardZoneCount,
}: MetropolitanStatusProps) {
  return (
    <section className="metro-status" aria-labelledby="metro-status-title">
      <div className="metro-status-heading">
        <div>
          <span className="eyebrow">Estado metropolitano</span>
          <h2 id="metro-status-title">Monterrey ahora</h2>
          <p>{status.observedAt}</p>
        </div>
        <span className={`metro-source metro-source-${status.source}`}>
          {status.source === "live"
            ? "Clima y aire conectados"
            : status.source === "partial"
              ? "Datos parciales"
              : "Sin conexión externa"}
        </span>
      </div>

      <div className="metro-metrics">
        <article className="metro-metric metro-weather">
          <span className="metro-icon" aria-hidden="true">{status.weatherIcon}</span>
          <div>
            <small>Clima</small>
            <strong>{metric(status.temperatureC, "°")}</strong>
            <span>{status.weatherLabel}</span>
          </div>
        </article>

        <article className="metro-metric">
          <span className="metro-icon" aria-hidden="true">☂</span>
          <div>
            <small>Lluvia hoy</small>
            <strong>{metric(status.rainProbability, "%")}</strong>
            <span>{metric(status.precipitationMm, " mm")} ahora</span>
          </div>
        </article>

        <article className="metro-metric">
          <span className="metro-icon" aria-hidden="true">➤</span>
          <div>
            <small>Viento</small>
            <strong>{metric(status.windKmh, " km/h")}</strong>
            <span>Ráfagas {metric(status.windGustKmh, " km/h")}</span>
          </div>
        </article>

        <article className={`metro-metric metro-aqi metro-aqi-${aqiTone(status.usAqi)}`}>
          <span className="metro-icon" aria-hidden="true">◉</span>
          <div>
            <small>Calidad del aire</small>
            <strong>{metric(status.usAqi)}</strong>
            <span>{status.airQualityLabel}</span>
          </div>
        </article>

        <article className="metro-metric metro-operations">
          <span className="metro-icon" aria-hidden="true">!</span>
          <div>
            <small>Operación</small>
            <strong>{incidentCount}</strong>
            <span>avisos recientes</span>
          </div>
        </article>

        <article className="metro-metric metro-services">
          <span className="metro-icon" aria-hidden="true">⌂</span>
          <div>
            <small>Red disponible</small>
            <strong>{resourceCount}</strong>
            <span>{roadClosureCount} cierres · {hazardZoneCount} zonas</span>
          </div>
        </article>
      </div>
    </section>
  );
}

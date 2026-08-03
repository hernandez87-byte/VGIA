import type { CityStatus } from "@/lib/data/city-status";

interface EnvironmentalIntelligenceProps {
  status: CityStatus;
}

function metric(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${Math.round(value)}${suffix}`;
}

function hydrologyState(status: CityStatus): {
  label: string;
  tone: "low" | "watch" | "high";
  description: string;
} {
  const rain = status.rainProbability ?? 0;
  const current = status.precipitationMm ?? 0;

  if (rain >= 70 || current >= 8) {
    return {
      label: "Escurrimiento alto",
      tone: "high",
      description:
        "Activa Corrientes e Inundación frecuente en el mapa. Evita cauces, pasos bajos y cruces cubiertos por agua.",
    };
  }
  if (rain >= 40 || current >= 2) {
    return {
      label: "Escurrimiento en vigilancia",
      tone: "watch",
      description:
        "La red hidrográfica puede concentrar agua si aumenta la lluvia. Revisa corrientes y zonas TR2 antes de desplazarte.",
    };
  }
  return {
    label: "Escurrimiento bajo",
    tone: "low",
    description:
      "No se observa lluvia suficiente para elevar el contexto pluvial, pero la capa de corrientes no mide caudal en tiempo real.",
  };
}

export function EnvironmentalIntelligence({ status }: EnvironmentalIntelligenceProps) {
  const hydrology = hydrologyState(status);

  return (
    <section className="environment-panel" aria-labelledby="environment-title">
      <div className="environment-heading">
        <div>
          <span className="eyebrow">Clima y astronomía local</span>
          <h2 id="environment-title">Pronóstico, presión y ciclo lunar</h2>
          <p>
            Modelos meteorológicos para Monterrey y cálculo astronómico local. No sustituyen avisos oficiales.
          </p>
        </div>
        <span className="environment-live">Actualiza cada 5 min</span>
      </div>

      <div className={`hydrology-context hydrology-context-${hydrology.tone}`}>
        <span className="hydrology-icon" aria-hidden="true">≋</span>
        <div>
          <span>Contexto pluvial actual</span>
          <strong>{hydrology.label}</strong>
          <p>{hydrology.description}</p>
        </div>
        <div className="hydrology-metrics">
          <span><b>{metric(status.rainProbability, "%")}</b>probabilidad hoy</span>
          <span><b>{metric(status.precipitationMm, " mm")}</b>precipitación actual</span>
        </div>
        <a href="#mapa-operativo">Abrir capas de agua</a>
      </div>

      <div className="environment-layout">
        <div className="forecast-strip" aria-label="Pronóstico de siete días">
          {status.forecast.length > 0 ? (
            status.forecast.map((day, index) => (
              <article className={index === 0 ? "forecast-day forecast-today" : "forecast-day"} key={day.date}>
                <span className="forecast-day-label">{index === 0 ? "Hoy" : day.label}</span>
                <span className="forecast-icon" aria-hidden="true">{day.icon}</span>
                <strong>{metric(day.temperatureMaxC, "°")}</strong>
                <small>{metric(day.temperatureMinC, "°")} mínima</small>
                <div className="forecast-facts">
                  <span>☂ {metric(day.rainProbability, "%")}</span>
                  <span>➤ {metric(day.windMaxKmh, " km/h")}</span>
                </div>
                <p>{day.weatherLabel}</p>
              </article>
            ))
          ) : (
            <div className="forecast-empty">Pronóstico no disponible en este momento.</div>
          )}
        </div>

        <aside className="atmosphere-card" aria-label="Condiciones atmosféricas">
          <div className="atmosphere-title">
            <span>Atmósfera</span>
            <strong>{metric(status.seaLevelPressureHpa, " hPa")}</strong>
          </div>
          <dl>
            <div><dt>Presión local</dt><dd>{metric(status.surfacePressureHpa, " hPa")}</dd></div>
            <div><dt>Humedad</dt><dd>{metric(status.relativeHumidity, "%")}</dd></div>
            <div><dt>Nubosidad</dt><dd>{metric(status.cloudCoverPercent, "%")}</dd></div>
            <div><dt>Viento</dt><dd>{metric(status.windKmh, " km/h")} {status.windDirectionLabel}</dd></div>
            <div><dt>Ráfagas</dt><dd>{metric(status.windGustKmh, " km/h")}</dd></div>
          </dl>
          <a href="#mapa-operativo">Ver mapas atmosféricos</a>
        </aside>

        <aside className="moon-card" aria-label="Fase lunar">
          <div className="moon-visual" aria-hidden="true">{status.moon.icon}</div>
          <div>
            <span>Ciclo lunar</span>
            <h3>{status.moon.phase}</h3>
            <p>{status.moon.illuminationPercent}% iluminada · edad {status.moon.ageDays} días</p>
          </div>
          <dl>
            <div><dt>Próxima llena</dt><dd>{status.moon.nextFullMoon}</dd></div>
            <div><dt>Próxima nueva</dt><dd>{status.moon.nextNewMoon}</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  );
}

import type { CityStatus } from "@/lib/data/city-status";

interface EnvironmentalIntelligenceProps {
  status: CityStatus;
}

function metric(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${Math.round(value)}${suffix}`;
}

export function EnvironmentalIntelligence({ status }: EnvironmentalIntelligenceProps) {
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatMetric,
  type LocationWeatherData,
  type PointCoordinates,
} from "@/lib/domain/location-weather";

type State = "idle" | "locating" | "loading" | "ready" | "error";

function insight(data: LocationWeatherData) {
  if ((data.precipitationMm ?? 0) >= 5 || (data.windGustKmh ?? 0) >= 60) {
    return ["danger", "Condiciones que requieren atención", "Hay lluvia relevante o ráfagas fuertes en este punto. Revisa corrientes, cierres y avisos antes de moverte."] as const;
  }
  if ((data.temperatureC ?? 0) >= 38 || (data.usAqi ?? 0) > 100) {
    return ["watch", "Exposición elevada", "La temperatura o la calidad del aire pueden afectar a personas sensibles."] as const;
  }
  return ["good", "Sin señal meteorológica crítica", "La lectura es modelada y puede diferir de un sensor físico cercano."] as const;
}

export function PersonalLocationWeather() {
  const [state, setState] = useState<State>("idle");
  const [point, setPoint] = useState<PointCoordinates | null>(null);
  const [data, setData] = useState<LocationWeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (coordinates: PointCoordinates) => {
    setState("loading");
    setError(null);
    try {
      const response = await fetch(
        `/api/location-weather?lat=${coordinates.latitude.toFixed(5)}&lon=${coordinates.longitude.toFixed(5)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as LocationWeatherData | { error?: string };
      if (!response.ok || !("coordinates" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "No fue posible consultar el punto");
      }
      setPoint(coordinates);
      setData(payload);
      setState("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible consultar el punto");
      setState("error");
    }
  }, []);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Este navegador no ofrece geolocalización.");
      setState("error");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => void load({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyM: position.coords.accuracy,
      }),
      (failure) => {
        setError(failure.code === failure.PERMISSION_DENIED
          ? "El permiso de ubicación fue rechazado."
          : "No fue posible obtener una ubicación precisa.");
        setState("error");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }, [load]);

  useEffect(() => {
    if (!point || state !== "ready") return;
    const timer = window.setInterval(() => void load(point), 300_000);
    return () => window.clearInterval(timer);
  }, [load, point, state]);

  const status = useMemo(() => (data ? insight(data) : null), [data]);

  return (
    <section className={data ? "personal-weather personal-weather-compact has-data" : "personal-weather personal-weather-compact"} aria-labelledby="personal-weather-title">
      <header className="personal-weather-heading">
        <div>
          <span className="eyebrow">Tu ubicación</span>
          <h2 id="personal-weather-title">Condiciones exactas del punto</h2>
          {!data ? <p>Consulta clima, presión, viento, aire y altitud en tu posición actual.</p> : null}
        </div>
        <div className="personal-weather-actions">
          <button type="button" onClick={locate} disabled={state === "locating" || state === "loading"}>
            {state === "locating" ? "Buscando GPS…" : state === "loading" ? "Consultando…" : data ? "Actualizar ubicación" : "Usar mi ubicación"}
          </button>
          {point && data ? <button type="button" className="personal-weather-refresh" onClick={() => void load(point)}>Actualizar datos</button> : null}
        </div>
      </header>

      {data && point ? (
        <div className="personal-weather-content personal-weather-content-compact">
          <div className="personal-weather-summary-strip">
            <div className="personal-point-summary">
              <span>Punto consultado</span>
              <strong>{point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</strong>
              <small>{point.accuracyM ? `GPS ±${Math.round(point.accuracyM)} m` : "Ubicación consultada"}</small>
            </div>
            <div><span>Altitud</span><strong>{formatMetric(data.elevationM, " m")}</strong><small>s. n. m.</small></div>
            <div><span>Temperatura</span><strong>{formatMetric(data.temperatureC, " °C", 1)}</strong><small>Sensación {formatMetric(data.apparentTemperatureC, " °C", 1)}</small></div>
            <div><span>Humedad</span><strong>{formatMetric(data.relativeHumidityPercent, "%")}</strong><small>Rocío {formatMetric(data.dewPointC, " °C", 1)}</small></div>
            <div><span>Presión local</span><strong>{formatMetric(data.surfacePressureHpa, " hPa", 1)}</strong><small>Nivel mar {formatMetric(data.seaLevelPressureHpa, " hPa", 1)}</small></div>
            <div><span>Viento</span><strong>{formatMetric(data.windKmh, " km/h", 1)}</strong><small>{data.windDirectionLabel} · ráfagas {formatMetric(data.windGustKmh, " km/h", 1)}</small></div>
            <div><span>Aire</span><strong>{formatMetric(data.usAqi)}</strong><small>{data.airQualityLabel}</small></div>
          </div>

          {status ? <div className={`personal-weather-insight personal-weather-insight-${status[0]} personal-weather-insight-compact`}><span>i</span><div><strong>{status[1]}</strong><p>{status[2]}</p></div></div> : null}

          <details className="personal-weather-details">
            <summary>Ver análisis meteorológico completo</summary>
            <div className="personal-weather-details-grid">
              <article><span>Cielo</span><strong>{data.weatherLabel}</strong><small>Nubes {formatMetric(data.cloudCoverPercent, "%")}</small></article>
              <article><span>Precipitación</span><strong>{formatMetric(data.precipitationMm, " mm", 1)}</strong><small>Lluvia {formatMetric(data.rainMm, " mm", 1)}</small></article>
              <article><span>PM2.5</span><strong>{formatMetric(data.pm25, " µg/m³", 1)}</strong><small>PM10 {formatMetric(data.pm10, " µg/m³", 1)}</small></article>
              <article><span>Diferencia de presión</span><strong>{formatMetric(data.pressureDifferenceHpa, " hPa", 1)}</strong><small>Ajuste por elevación</small></article>
            </div>
            <footer className="personal-weather-meta">
              <span>Lectura {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.observedAt))}</span>
              <span>Fuente {data.source}</span>
              <span>La ubicación no se guarda.</span>
            </footer>
          </details>
        </div>
      ) : (
        <div className="personal-weather-empty personal-weather-empty-compact">
          <div className="personal-weather-radar" aria-hidden="true"><i /><i /><i /><span>⌖</span></div>
          <div><strong>Activa tu ubicación para obtener una lectura puntual</strong><p>Las coordenadas se usan solo para esta consulta.</p></div>
          {error ? <p className="personal-weather-error" role="alert">{error}</p> : null}
        </div>
      )}
    </section>
  );
}

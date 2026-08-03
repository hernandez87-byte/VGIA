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
    <section className="personal-weather" aria-labelledby="personal-weather-title">
      <header className="personal-weather-heading">
        <div>
          <span className="eyebrow">Condiciones exactas del punto</span>
          <h2 id="personal-weather-title">El clima donde estás, no el promedio de Monterrey</h2>
          <p>Temperatura, humedad, presión, viento, aire y altitud para tu posición actual.</p>
        </div>
        <div className="personal-weather-actions">
          <button type="button" onClick={locate} disabled={state === "locating" || state === "loading"}>
            {state === "locating" ? "Buscando GPS…" : state === "loading" ? "Consultando…" : "Usar mi ubicación"}
          </button>
          {point ? <button type="button" className="personal-weather-refresh" onClick={() => void load(point)}>Actualizar</button> : null}
        </div>
      </header>

      {data && point ? (
        <div className="personal-weather-content">
          <div className="personal-weather-location">
            <div>
              <span>Punto consultado</span>
              <strong>{point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</strong>
              <small>{point.accuracyM ? `Precisión GPS aproximada ±${Math.round(point.accuracyM)} m` : "Ubicación consultada"}</small>
            </div>
            <div className="personal-altitude">
              <span>Altitud estimada</span>
              <strong>{formatMetric(data.elevationM, " m s. n. m.")}</strong>
              <small>Modelo topográfico</small>
            </div>
          </div>

          <div className="personal-weather-metrics">
            <article><span>Temperatura</span><strong>{formatMetric(data.temperatureC, " °C", 1)}</strong><small>Sensación {formatMetric(data.apparentTemperatureC, " °C", 1)}</small></article>
            <article><span>Humedad</span><strong>{formatMetric(data.relativeHumidityPercent, "%")}</strong><small>Rocío {formatMetric(data.dewPointC, " °C", 1)}</small></article>
            <article><span>Presión local</span><strong>{formatMetric(data.surfacePressureHpa, " hPa", 1)}</strong><small>Real a esa altitud</small></article>
            <article><span>Presión nivel mar</span><strong>{formatMetric(data.seaLevelPressureHpa, " hPa", 1)}</strong><small>Diferencia +{formatMetric(data.pressureDifferenceHpa, " hPa", 1)}</small></article>
            <article><span>Viento</span><strong>{formatMetric(data.windKmh, " km/h", 1)}</strong><small>{data.windDirectionLabel} · ráfagas {formatMetric(data.windGustKmh, " km/h", 1)}</small></article>
            <article><span>Cielo</span><strong>{data.weatherLabel}</strong><small>Nubes {formatMetric(data.cloudCoverPercent, "%")} · lluvia {formatMetric(data.precipitationMm, " mm", 1)}</small></article>
            <article><span>Calidad del aire</span><strong>{formatMetric(data.usAqi)}</strong><small>{data.airQualityLabel} · PM2.5 {formatMetric(data.pm25, " µg/m³", 1)}</small></article>
          </div>

          {status ? <div className={`personal-weather-insight personal-weather-insight-${status[0]}`}><span>i</span><div><strong>{status[1]}</strong><p>{status[2]}</p></div></div> : null}
          <footer className="personal-weather-meta">
            <span>Lectura {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.observedAt))}</span>
            <span>Fuente {data.source}</span>
            <span>La ubicación no se guarda.</span>
          </footer>
        </div>
      ) : (
        <div className="personal-weather-empty">
          <div className="personal-weather-radar" aria-hidden="true"><i /><i /><i /><span>⌖</span></div>
          <div><strong>Activa tu ubicación para obtener una lectura puntual</strong><p>El navegador comparte las coordenadas solo para esta consulta.</p></div>
          {error ? <p className="personal-weather-error" role="alert">{error}</p> : null}
        </div>
      )}
    </section>
  );
}

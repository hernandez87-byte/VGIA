export interface CityStatus {
  observedAt: string;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  precipitationMm: number | null;
  rainProbability: number | null;
  windKmh: number | null;
  windGustKmh: number | null;
  weatherCode: number | null;
  weatherLabel: string;
  weatherIcon: string;
  usAqi: number | null;
  airQualityLabel: string;
  pm25: number | null;
  pm10: number | null;
  source: "live" | "partial" | "unavailable";
}

interface WeatherResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
  };
  daily?: {
    precipitation_probability_max?: number[];
  };
}

interface AirQualityResponse {
  current?: {
    time?: string;
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
  };
}

const LATITUDE = Number(process.env.NEXT_PUBLIC_DEFAULT_LATITUDE ?? "25.6866");
const LONGITUDE = Number(process.env.NEXT_PUBLIC_DEFAULT_LONGITUDE ?? "-100.3161");

function weatherDescription(code: number | null): { label: string; icon: string } {
  if (code === null) return { label: "Sin lectura", icon: "◌" };
  if (code === 0) return { label: "Despejado", icon: "☀" };
  if ([1, 2].includes(code)) return { label: "Parcialmente nublado", icon: "◐" };
  if (code === 3) return { label: "Nublado", icon: "☁" };
  if ([45, 48].includes(code)) return { label: "Niebla", icon: "≋" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Llovizna", icon: "⋰" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { label: "Lluvia", icon: "☂" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Nieve", icon: "✣" };
  if ([95, 96, 99].includes(code)) return { label: "Tormenta", icon: "ϟ" };
  return { label: "Condición variable", icon: "◌" };
}

function airQualityDescription(aqi: number | null): string {
  if (aqi === null) return "Sin lectura";
  if (aqi <= 50) return "Buena";
  if (aqi <= 100) return "Moderada";
  if (aqi <= 150) return "Dañina para sensibles";
  if (aqi <= 200) return "Dañina";
  if (aqi <= 300) return "Muy dañina";
  return "Peligrosa";
}

async function fetchWeather(): Promise<WeatherResponse | null> {
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", String(LATITUDE));
  endpoint.searchParams.set("longitude", String(LONGITUDE));
  endpoint.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m",
  );
  endpoint.searchParams.set("daily", "precipitation_probability_max");
  endpoint.searchParams.set("timezone", "America/Monterrey");
  endpoint.searchParams.set("forecast_days", "2");

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(7_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as WeatherResponse;
  } catch {
    return null;
  }
}

async function fetchAirQuality(): Promise<AirQualityResponse | null> {
  const endpoint = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  endpoint.searchParams.set("latitude", String(LATITUDE));
  endpoint.searchParams.set("longitude", String(LONGITUDE));
  endpoint.searchParams.set("current", "us_aqi,pm2_5,pm10");
  endpoint.searchParams.set("timezone", "America/Monterrey");

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(7_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as AirQualityResponse;
  } catch {
    return null;
  }
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function getCityStatus(): Promise<CityStatus> {
  const [weather, air] = await Promise.all([fetchWeather(), fetchAirQuality()]);
  const currentWeather = weather?.current;
  const currentAir = air?.current;
  const weatherCode = numberOrNull(currentWeather?.weather_code);
  const weatherText = weatherDescription(weatherCode);
  const usAqi = numberOrNull(currentAir?.us_aqi);

  const source = weather && air ? "live" : weather || air ? "partial" : "unavailable";

  return {
    observedAt: new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Monterrey",
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    temperatureC: numberOrNull(currentWeather?.temperature_2m),
    apparentTemperatureC: numberOrNull(currentWeather?.apparent_temperature),
    precipitationMm: numberOrNull(currentWeather?.precipitation),
    rainProbability: numberOrNull(weather?.daily?.precipitation_probability_max?.[0]),
    windKmh: numberOrNull(currentWeather?.wind_speed_10m),
    windGustKmh: numberOrNull(currentWeather?.wind_gusts_10m),
    weatherCode,
    weatherLabel: weatherText.label,
    weatherIcon: weatherText.icon,
    usAqi,
    airQualityLabel: airQualityDescription(usAqi),
    pm25: numberOrNull(currentAir?.pm2_5),
    pm10: numberOrNull(currentAir?.pm10),
    source,
  };
}

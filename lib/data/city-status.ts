import { getMoonStatus, type MoonStatus } from "@/lib/data/moon";

export interface HourlyRainPoint {
  time: string;
  label: string;
  probability: number;
}

export interface ForecastDay {
  date: string;
  label: string;
  icon: string;
  weatherLabel: string;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  rainProbability: number | null;
  windMaxKmh: number | null;
  windGustKmh: number | null;
  sunrise: string | null;
  sunset: string | null;
}

export interface CityStatus {
  observedAt: string;
  nextUpdateLabel: string;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  relativeHumidity: number | null;
  precipitationMm: number | null;
  rainProbability: number | null;
  hourlyRain: HourlyRainPoint[];
  forecast: ForecastDay[];
  windKmh: number | null;
  windGustKmh: number | null;
  windDirectionDeg: number | null;
  windDirectionLabel: string;
  surfacePressureHpa: number | null;
  seaLevelPressureHpa: number | null;
  cloudCoverPercent: number | null;
  weatherCode: number | null;
  weatherLabel: string;
  weatherIcon: string;
  moon: MoonStatus;
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
    relative_humidity_2m?: number;
    precipitation?: number;
    weather_code?: number;
    cloud_cover?: number;
    surface_pressure?: number;
    pressure_msl?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
    wind_gusts_10m_max?: number[];
    sunrise?: string[];
    sunset?: string[];
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
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Lluvia", icon: "☂" };
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

function windDirectionLabel(degrees: number | null): string {
  if (degrees === null) return "—";
  const labels = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return labels[Math.round(degrees / 45) % 8] ?? "—";
}

async function fetchWeather(): Promise<WeatherResponse | null> {
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", String(LATITUDE));
  endpoint.searchParams.set("longitude", String(LONGITUDE));
  endpoint.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,surface_pressure,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
  );
  endpoint.searchParams.set("hourly", "precipitation_probability");
  endpoint.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset",
  );
  endpoint.searchParams.set("timezone", "America/Monterrey");
  endpoint.searchParams.set("forecast_days", "7");

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

function hourlyRainOutlook(weather: WeatherResponse | null): HourlyRainPoint[] {
  const times = weather?.hourly?.time ?? [];
  const probabilities = weather?.hourly?.precipitation_probability ?? [];
  if (times.length === 0 || probabilities.length === 0) return [];

  const currentTime = weather?.current?.time ?? new Date().toISOString().slice(0, 13) + ":00";
  const startIndex = Math.max(0, times.findIndex((time) => time >= currentTime));
  const resolvedStart = startIndex === -1 ? 0 : startIndex;

  return times.slice(resolvedStart, resolvedStart + 6).map((time, index) => ({
    time,
    label: time.slice(11, 16),
    probability: Math.round(numberOrNull(probabilities[resolvedStart + index]) ?? 0),
  }));
}

function formatClock(value: string | undefined): string | null {
  if (!value) return null;
  const time = value.slice(11, 16);
  return time || null;
}

function dailyForecast(weather: WeatherResponse | null): ForecastDay[] {
  const daily = weather?.daily;
  const dates = daily?.time ?? [];

  return dates.slice(0, 7).map((date, index) => {
    const code = numberOrNull(daily?.weather_code?.[index]);
    const description = weatherDescription(code);
    const parsed = new Date(`${date}T12:00:00-06:00`);

    return {
      date,
      label: new Intl.DateTimeFormat("es-MX", {
        timeZone: "America/Monterrey",
        weekday: "short",
        day: "2-digit",
      }).format(parsed),
      icon: description.icon,
      weatherLabel: description.label,
      temperatureMaxC: numberOrNull(daily?.temperature_2m_max?.[index]),
      temperatureMinC: numberOrNull(daily?.temperature_2m_min?.[index]),
      rainProbability: numberOrNull(daily?.precipitation_probability_max?.[index]),
      windMaxKmh: numberOrNull(daily?.wind_speed_10m_max?.[index]),
      windGustKmh: numberOrNull(daily?.wind_gusts_10m_max?.[index]),
      sunrise: formatClock(daily?.sunrise?.[index]),
      sunset: formatClock(daily?.sunset?.[index]),
    };
  });
}

export async function getCityStatus(): Promise<CityStatus> {
  const [weather, air] = await Promise.all([fetchWeather(), fetchAirQuality()]);
  const currentWeather = weather?.current;
  const currentAir = air?.current;
  const weatherCode = numberOrNull(currentWeather?.weather_code);
  const weatherText = weatherDescription(weatherCode);
  const usAqi = numberOrNull(currentAir?.us_aqi);
  const windDirectionDeg = numberOrNull(currentWeather?.wind_direction_10m);
  const now = new Date();
  const nextUpdate = new Date(now.getTime() + 5 * 60 * 1000);
  const source = weather && air ? "live" : weather || air ? "partial" : "unavailable";

  return {
    observedAt: new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Monterrey",
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(now),
    nextUpdateLabel: new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Monterrey",
      hour: "2-digit",
      minute: "2-digit",
    }).format(nextUpdate),
    temperatureC: numberOrNull(currentWeather?.temperature_2m),
    apparentTemperatureC: numberOrNull(currentWeather?.apparent_temperature),
    relativeHumidity: numberOrNull(currentWeather?.relative_humidity_2m),
    precipitationMm: numberOrNull(currentWeather?.precipitation),
    rainProbability: numberOrNull(weather?.daily?.precipitation_probability_max?.[0]),
    hourlyRain: hourlyRainOutlook(weather),
    forecast: dailyForecast(weather),
    windKmh: numberOrNull(currentWeather?.wind_speed_10m),
    windGustKmh: numberOrNull(currentWeather?.wind_gusts_10m),
    windDirectionDeg,
    windDirectionLabel: windDirectionLabel(windDirectionDeg),
    surfacePressureHpa: numberOrNull(currentWeather?.surface_pressure),
    seaLevelPressureHpa: numberOrNull(currentWeather?.pressure_msl),
    cloudCoverPercent: numberOrNull(currentWeather?.cloud_cover),
    weatherCode,
    weatherLabel: weatherText.label,
    weatherIcon: weatherText.icon,
    moon: getMoonStatus(now),
    usAqi,
    airQualityLabel: airQualityDescription(usAqi),
    pm25: numberOrNull(currentAir?.pm2_5),
    pm10: numberOrNull(currentAir?.pm10),
    source,
  };
}

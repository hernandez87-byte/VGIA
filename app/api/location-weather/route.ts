export const dynamic = "force-dynamic";

interface OpenMeteoCurrent {
  time?: string;
  interval?: number;
  temperature_2m?: number;
  apparent_temperature?: number;
  relative_humidity_2m?: number;
  dew_point_2m?: number;
  precipitation?: number;
  rain?: number;
  weather_code?: number;
  cloud_cover?: number;
  surface_pressure?: number;
  pressure_msl?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
}

interface OpenMeteoWeatherResponse {
  latitude?: number;
  longitude?: number;
  elevation?: number;
  timezone?: string;
  timezone_abbreviation?: string;
  utc_offset_seconds?: number;
  current?: OpenMeteoCurrent;
}

interface OpenMeteoAirResponse {
  current?: {
    time?: string;
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
  };
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function weatherLabel(code: number | null): string {
  if (code === null) return "Sin lectura";
  if (code === 0) return "Despejado";
  if ([1, 2].includes(code)) return "Parcialmente nublado";
  if (code === 3) return "Nublado";
  if ([45, 48].includes(code)) return "Niebla";
  if ([51, 53, 55, 56, 57].includes(code)) return "Llovizna";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Lluvia";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Nieve";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  return "Condición variable";
}

function compassDirection(degrees: number | null): string {
  if (degrees === null) return "—";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  return directions[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16] ?? "—";
}

function airQualityLabel(aqi: number | null): string {
  if (aqi === null) return "Sin lectura";
  if (aqi <= 50) return "Buena";
  if (aqi <= 100) return "Moderada";
  if (aqi <= 150) return "Dañina para sensibles";
  if (aqi <= 200) return "Dañina";
  if (aqi <= 300) return "Muy dañina";
  return "Peligrosa";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lon"));

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return Response.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const weatherEndpoint = new URL("https://api.open-meteo.com/v1/forecast");
  weatherEndpoint.searchParams.set("latitude", latitude.toFixed(5));
  weatherEndpoint.searchParams.set("longitude", longitude.toFixed(5));
  weatherEndpoint.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,precipitation,rain,weather_code,cloud_cover,surface_pressure,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
  );
  weatherEndpoint.searchParams.set("timezone", "auto");
  weatherEndpoint.searchParams.set("forecast_days", "1");

  const airEndpoint = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  airEndpoint.searchParams.set("latitude", latitude.toFixed(5));
  airEndpoint.searchParams.set("longitude", longitude.toFixed(5));
  airEndpoint.searchParams.set("current", "us_aqi,pm2_5,pm10");
  airEndpoint.searchParams.set("timezone", "auto");

  try {
    const [weatherResponse, airResponse] = await Promise.all([
      fetch(weatherEndpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      }),
      fetch(airEndpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      }),
    ]);

    if (!weatherResponse.ok) {
      return Response.json({ error: "No fue posible consultar el clima del punto" }, { status: 502 });
    }

    const weather = (await weatherResponse.json()) as OpenMeteoWeatherResponse;
    const air = airResponse.ok ? ((await airResponse.json()) as OpenMeteoAirResponse) : null;
    const current = weather.current;
    const surfacePressure = finiteNumber(current?.surface_pressure);
    const seaLevelPressure = finiteNumber(current?.pressure_msl);
    const windDirectionDeg = finiteNumber(current?.wind_direction_10m);
    const weatherCode = finiteNumber(current?.weather_code);
    const aqi = finiteNumber(air?.current?.us_aqi);

    return Response.json(
      {
        coordinates: {
          latitude: finiteNumber(weather.latitude) ?? latitude,
          longitude: finiteNumber(weather.longitude) ?? longitude,
        },
        elevationM: finiteNumber(weather.elevation),
        observedAt: current?.time ?? new Date().toISOString(),
        timezone: weather.timezone ?? null,
        timezoneAbbreviation: weather.timezone_abbreviation ?? null,
        temperatureC: finiteNumber(current?.temperature_2m),
        apparentTemperatureC: finiteNumber(current?.apparent_temperature),
        relativeHumidityPercent: finiteNumber(current?.relative_humidity_2m),
        dewPointC: finiteNumber(current?.dew_point_2m),
        precipitationMm: finiteNumber(current?.precipitation),
        rainMm: finiteNumber(current?.rain),
        cloudCoverPercent: finiteNumber(current?.cloud_cover),
        weatherCode,
        weatherLabel: weatherLabel(weatherCode),
        surfacePressureHpa: surfacePressure,
        seaLevelPressureHpa: seaLevelPressure,
        pressureDifferenceHpa:
          surfacePressure !== null && seaLevelPressure !== null
            ? Math.round((seaLevelPressure - surfacePressure) * 10) / 10
            : null,
        windKmh: finiteNumber(current?.wind_speed_10m),
        windGustKmh: finiteNumber(current?.wind_gusts_10m),
        windDirectionDeg,
        windDirectionLabel: compassDirection(windDirectionDeg),
        usAqi: aqi,
        airQualityLabel: airQualityLabel(aqi),
        pm25: finiteNumber(air?.current?.pm2_5),
        pm10: finiteNumber(air?.current?.pm10),
        source: "Open-Meteo",
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "X-Location-Storage": "none",
        },
      },
    );
  } catch {
    return Response.json({ error: "La fuente meteorológica no respondió" }, { status: 503 });
  }
}

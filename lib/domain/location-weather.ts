export interface PointCoordinates {
  latitude: number;
  longitude: number;
  accuracyM?: number;
}

export interface LocationWeatherData {
  coordinates: { latitude: number; longitude: number };
  elevationM: number | null;
  observedAt: string;
  timezone: string | null;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  relativeHumidityPercent: number | null;
  dewPointC: number | null;
  precipitationMm: number | null;
  rainMm: number | null;
  cloudCoverPercent: number | null;
  weatherLabel: string;
  surfacePressureHpa: number | null;
  seaLevelPressureHpa: number | null;
  pressureDifferenceHpa: number | null;
  windKmh: number | null;
  windGustKmh: number | null;
  windDirectionDeg: number | null;
  windDirectionLabel: string;
  usAqi: number | null;
  airQualityLabel: string;
  pm25: number | null;
  pm10: number | null;
  source: string;
}

export function formatMetric(value: number | null, suffix = "", digits = 0): string {
  return value === null ? "—" : `${value.toFixed(digits)}${suffix}`;
}

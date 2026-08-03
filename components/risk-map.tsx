"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GeolocateControl,
  LngLatBounds,
  Map,
  Marker,
  NavigationControl,
  Popup,
  type GeoJSONSourceSpecification,
  type StyleSpecification,
} from "maplibre-gl";
import type { HazardZone, ResourcePoint, RoadClosure } from "@/lib/domain/emergency";

interface RiskMapProps {
  resources: ResourcePoint[];
  hazardZones: HazardZone[];
  roadClosures: RoadClosure[];
}

interface LayerVisibility {
  resources: boolean;
  hazards: boolean;
  closures: boolean;
  waterways: boolean;
  frequentFlood: boolean;
  historicalFlood: boolean;
  seismic: boolean;
}

type WeatherMode = "none" | "temperature" | "pressure" | "wind";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface WeatherGridPoint {
  id: string;
  latitude: number;
  longitude: number;
  temperatureC: number | null;
  surfacePressureHpa: number | null;
  windKmh: number | null;
  windDirectionDeg: number | null;
}

interface WeatherGridResponse {
  points?: WeatherGridPoint[];
  source?: string;
}

interface GeoFeature {
  type: "Feature";
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown>;
}

interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

interface TerritorialResponse {
  frequentFlood?: FeatureCollection;
  historicalFlood?: FeatureCollection;
  waterways?: FeatureCollection;
  seismic?: FeatureCollection;
  sources?: Record<string, string>;
}

const EMPTY_COLLECTION: FeatureCollection = { type: "FeatureCollection", features: [] };
const DEFAULT_LATITUDE = Number(process.env.NEXT_PUBLIC_DEFAULT_LATITUDE ?? "25.6866");
const DEFAULT_LONGITUDE = Number(process.env.NEXT_PUBLIC_DEFAULT_LONGITUDE ?? "-100.3161");
const configuredMapStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();

const OPENSTREETMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    openstreetmap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "openstreetmap-basemap",
      type: "raster",
      source: "openstreetmap",
      minzoom: 0,
      maxzoom: 22,
      paint: { "raster-fade-duration": 0 },
    },
  ],
};

function resolveMapStyle(): string | StyleSpecification {
  if (!configuredMapStyle || configuredMapStyle.includes("demotiles.maplibre.org/style.json")) {
    return OPENSTREETMAP_STYLE;
  }
  return configuredMapStyle;
}

const markerSymbol: Record<ResourcePoint["category"], string> = {
  shelter: "⌂",
  water: "◒",
  medical: "+",
  food: "●",
  energy: "ϟ",
  hardware: "◆",
  communications: "⌁",
};

const categoryLabel: Record<ResourcePoint["category"], string> = {
  shelter: "Refugio",
  water: "Agua",
  medical: "Salud",
  food: "Alimentos",
  energy: "Energía",
  hardware: "Herramientas",
  communications: "Comunicación",
};

const statusLabel: Record<ResourcePoint["status"], string> = {
  available: "Disponible",
  limited: "Limitado",
  closed: "Cerrado",
  unknown: "Sin confirmar",
};

function haversineKm(from: Coordinates, to: Coordinates): number {
  const radiusKm = 6371;
  const radians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const latitudeA = radians(from.latitude);
  const latitudeB = radians(to.latitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function popupContent(resource: ResourcePoint): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "map-popup";
  const title = document.createElement("strong");
  title.textContent = resource.name;
  const details = document.createElement("span");
  details.textContent = resource.details;
  const status = document.createElement("small");
  status.textContent = resource.isSimulation
    ? "Dato de demostración"
    : `${statusLabel[resource.status]} · actualizado hace ${resource.updatedMinutesAgo} min`;
  wrapper.append(title, details, status);
  return wrapper;
}

function weatherCollection(points: WeatherGridPoint[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
      properties: {
        temperatureC: point.temperatureC,
        surfacePressureHpa: point.surfacePressureHpa,
        windKmh: point.windKmh,
        windDirectionDeg: point.windDirectionDeg,
      },
    })),
  };
}

function extendFeatureBounds(bounds: LngLatBounds, collection: FeatureCollection): void {
  collection.features.forEach((feature) => {
    if (feature.geometry?.type !== "Point" || !Array.isArray(feature.geometry.coordinates)) return;
    const [longitude, latitude] = feature.geometry.coordinates as number[];
    if (Number.isFinite(longitude) && Number.isFinite(latitude)) bounds.extend([longitude, latitude]);
  });
}

export function RiskMap({ resources, hazardZones, roadClosures }: RiskMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const [externalState, setExternalState] = useState<"loading" | "ready" | "partial">("loading");
  const [locationState, setLocationState] = useState<"pending" | "ready" | "unavailable">("pending");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedResource, setSelectedResource] = useState<ResourcePoint | null>(null);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>("none");
  const [weatherPoints, setWeatherPoints] = useState<WeatherGridPoint[]>([]);
  const [territorial, setTerritorial] = useState<TerritorialResponse>({});
  const [layers, setLayers] = useState<LayerVisibility>({
    resources: true,
    hazards: true,
    closures: true,
    waterways: false,
    frequentFlood: false,
    historicalFlood: false,
    seismic: false,
  });

  const frequentFlood = territorial.frequentFlood ?? EMPTY_COLLECTION;
  const historicalFlood = territorial.historicalFlood ?? EMPTY_COLLECTION;
  const waterways = territorial.waterways ?? EMPTY_COLLECTION;
  const seismic = territorial.seismic ?? EMPTY_COLLECTION;

  useEffect(() => {
    let cancelled = false;
    setExternalState("loading");
    Promise.allSettled([
      fetch("/api/weather-grid", { cache: "no-store" }).then((response) => response.json() as Promise<WeatherGridResponse>),
      fetch("/api/territorial-layers", { cache: "no-store" }).then((response) => response.json() as Promise<TerritorialResponse>),
    ]).then(([weatherResult, territorialResult]) => {
      if (cancelled) return;
      const weather = weatherResult.status === "fulfilled" ? weatherResult.value : null;
      const territory = territorialResult.status === "fulfilled" ? territorialResult.value : null;
      setWeatherPoints(weather?.points ?? []);
      setTerritorial(territory ?? {});
      setExternalState(weather && territory ? "ready" : "partial");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCount = useMemo(
    () =>
      (layers.resources ? resources.length : 0) +
      (layers.hazards ? hazardZones.length : 0) +
      (layers.closures ? roadClosures.length : 0) +
      (layers.waterways ? waterways.features.length : 0) +
      (layers.frequentFlood ? frequentFlood.features.length : 0) +
      (layers.historicalFlood ? historicalFlood.features.length : 0) +
      (layers.seismic ? seismic.features.length : 0) +
      (weatherMode !== "none" ? weatherPoints.length : 0),
    [
      frequentFlood.features.length,
      hazardZones.length,
      historicalFlood.features.length,
      layers,
      resources.length,
      roadClosures.length,
      seismic.features.length,
      waterways.features.length,
      weatherMode,
      weatherPoints.length,
    ],
  );

  const selectedDistance = useMemo(() => {
    if (
      !selectedResource ||
      !userLocation ||
      typeof selectedResource.latitude !== "number" ||
      typeof selectedResource.longitude !== "number"
    ) return null;
    return haversineKm(userLocation, {
      latitude: selectedResource.latitude,
      longitude: selectedResource.longitude,
    });
  }, [selectedResource, userLocation]);

  useEffect(() => {
    if (!mapContainer.current) return;

    setMapState("loading");
    let hasLoaded = false;

    const map = new Map({
      container: mapContainer.current,
      style: resolveMapStyle(),
      center: [DEFAULT_LONGITUDE, DEFAULT_LATITUDE],
      zoom: 11.8,
      attributionControl: true,
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right",
    );

    const markers: Marker[] = [];
    const loadTimeout = window.setTimeout(() => {
      if (!hasLoaded) setMapState("error");
    }, 15_000);

    map.once("load", () => {
      hasLoaded = true;
      window.clearTimeout(loadTimeout);
      const bounds = new LngLatBounds();

      if (layers.hazards && hazardZones.length > 0) {
        const zoneCollection = {
          type: "FeatureCollection" as const,
          features: hazardZones.map((zone) => ({
            type: "Feature" as const,
            properties: { id: zone.id, riskScore: zone.riskScore, expectedDepthM: zone.expectedDepthM ?? null },
            geometry: zone.geometry,
          })),
        };
        map.addSource("vigia-hazard-zones", {
          type: "geojson",
          data: zoneCollection as GeoJSONSourceSpecification["data"],
        });
        map.addLayer({
          id: "vigia-hazard-fill",
          type: "fill",
          source: "vigia-hazard-zones",
          paint: {
            "fill-color": ["interpolate", ["linear"], ["get", "riskScore"], 0, "#f4b942", 70, "#ef6a4d", 100, "#c92f3d"],
            "fill-opacity": 0.38,
            "fill-outline-color": "#9c2731",
          },
        });
      }

      if (layers.closures && roadClosures.length > 0) {
        const closureCollection = {
          type: "FeatureCollection" as const,
          features: roadClosures.map((closure) => ({
            type: "Feature" as const,
            properties: { id: closure.id, reason: closure.reason },
            geometry: closure.geometry,
          })),
        };
        map.addSource("vigia-road-closures", {
          type: "geojson",
          data: closureCollection as GeoJSONSourceSpecification["data"],
        });
        map.addLayer({
          id: "vigia-road-closures-line",
          type: "line",
          source: "vigia-road-closures",
          paint: { "line-color": "#e55353", "line-width": 7, "line-dasharray": [1, 1.25] },
        });
      }

      if (layers.waterways && waterways.features.length > 0) {
        map.addSource("vigia-waterways", { type: "geojson", data: waterways as GeoJSONSourceSpecification["data"] });
        map.addLayer({
          id: "vigia-waterways-line",
          type: "line",
          source: "vigia-waterways",
          paint: {
            "line-color": ["match", ["get", "waterway"], "river", "#1277b8", "canal", "#2f9fd0", "#5bb9df"],
            "line-width": ["match", ["get", "waterway"], "river", 4, "canal", 3, 2],
            "line-opacity": 0.82,
          },
        });
      }

      if (layers.frequentFlood && frequentFlood.features.length > 0) {
        map.addSource("vigia-frequent-flood", { type: "geojson", data: frequentFlood as GeoJSONSourceSpecification["data"] });
        map.addLayer({
          id: "vigia-frequent-flood-fill",
          type: "fill",
          source: "vigia-frequent-flood",
          paint: {
            "fill-color": "#176ec4",
            "fill-opacity": 0.34,
            "fill-outline-color": "#0c4f9a",
          },
        });
      }

      if (layers.historicalFlood && historicalFlood.features.length > 0) {
        map.addSource("vigia-historical-flood", { type: "geojson", data: historicalFlood as GeoJSONSourceSpecification["data"] });
        map.addLayer({
          id: "vigia-historical-flood-circles",
          type: "circle",
          source: "vigia-historical-flood",
          paint: {
            "circle-radius": 7,
            "circle-color": "#f0a51c",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-opacity": 0.9,
          },
        });
      }

      if (layers.seismic && seismic.features.length > 0) {
        map.addSource("vigia-seismic", { type: "geojson", data: seismic as GeoJSONSourceSpecification["data"] });
        map.addLayer({
          id: "vigia-seismic-heat",
          type: "heatmap",
          source: "vigia-seismic",
          maxzoom: 10,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["coalesce", ["get", "mag"], 2.5], 2.5, 0.2, 5, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 4, 0.7, 9, 1.8],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 12, 9, 30],
            "heatmap-opacity": 0.72,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(76,47,130,0)",
              0.25,
              "#6b4bb3",
              0.5,
              "#b55ad5",
              0.75,
              "#ef6a69",
              1,
              "#ffd45c",
            ],
          },
        });
      }

      if (weatherMode !== "none" && weatherPoints.length > 0) {
        const collection = weatherCollection(weatherPoints);
        map.addSource("vigia-weather-grid", { type: "geojson", data: collection as GeoJSONSourceSpecification["data"] });

        if (weatherMode === "temperature") {
          map.addLayer({
            id: "vigia-temperature-map",
            type: "circle",
            source: "vigia-weather-grid",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 38, 13, 72],
              "circle-blur": 0.68,
              "circle-opacity": 0.58,
              "circle-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "temperatureC"], 25],
                10,
                "#275aa8",
                18,
                "#3db7d6",
                25,
                "#65c66b",
                30,
                "#f0c641",
                36,
                "#ef6a3f",
                42,
                "#b72b38",
              ],
            },
          });
        }

        if (weatherMode === "pressure") {
          map.addLayer({
            id: "vigia-pressure-map",
            type: "circle",
            source: "vigia-weather-grid",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 25, 13, 48],
              "circle-blur": 0.28,
              "circle-opacity": 0.52,
              "circle-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "surfacePressureHpa"], 900],
                760,
                "#5346a5",
                820,
                "#3d8bc3",
                900,
                "#2dbb9f",
                980,
                "#e3c248",
                1030,
                "#ef7042",
              ],
            },
          });
          weatherPoints.forEach((point, index) => {
            if (point.surfacePressureHpa === null || index % 2 !== 0) return;
            const element = document.createElement("div");
            element.className = "pressure-map-marker";
            element.innerHTML = `<strong>${Math.round(point.surfacePressureHpa)}</strong><span>hPa</span>`;
            markers.push(new Marker({ element }).setLngLat([point.longitude, point.latitude]).addTo(map));
          });
        }

        if (weatherMode === "wind") {
          weatherPoints.forEach((point) => {
            if (point.windKmh === null || point.windDirectionDeg === null) return;
            const element = document.createElement("div");
            element.className = "wind-map-marker";
            element.innerHTML = `<i style="transform:rotate(${point.windDirectionDeg}deg)">↑</i><strong>${Math.round(point.windKmh)}</strong><span>km/h</span>`;
            markers.push(new Marker({ element }).setLngLat([point.longitude, point.latitude]).addTo(map));
          });
        }
      }

      if (layers.resources) {
        resources.forEach((resource) => {
          if (typeof resource.latitude !== "number" || typeof resource.longitude !== "number") return;
          const element = document.createElement("button");
          element.type = "button";
          element.className = `live-resource-marker marker-${resource.category}`;
          element.textContent = markerSymbol[resource.category];
          element.setAttribute("aria-label", resource.name);
          element.addEventListener("click", () => setSelectedResource(resource));
          const marker = new Marker({ element })
            .setLngLat([resource.longitude, resource.latitude])
            .setPopup(new Popup({ offset: 18 }).setDOMContent(popupContent(resource)))
            .addTo(map);
          markers.push(marker);
          bounds.extend([resource.longitude, resource.latitude]);
        });
      }

      if (layers.seismic) {
        extendFeatureBounds(bounds, seismic);
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 72,
          maxZoom: layers.seismic ? 8 : 13,
          duration: 0,
        });
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            setUserLocation(coordinates);
            setLocationState("ready");
            const element = document.createElement("div");
            element.className = "user-location-marker";
            element.innerHTML = '<span></span><strong>Tu ubicación</strong>';
            const marker = new Marker({ element, anchor: "bottom" })
              .setLngLat([coordinates.longitude, coordinates.latitude])
              .addTo(map);
            markers.push(marker);
          },
          () => setLocationState("unavailable"),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 },
        );
      } else {
        setLocationState("unavailable");
      }

      setMapState("ready");
    });

    map.on("error", (event) => {
      console.error("VIGÍA MapLibre error", event.error);
      if (!hasLoaded) setMapState("error");
    });

    return () => {
      window.clearTimeout(loadTimeout);
      markers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [
    frequentFlood,
    hazardZones,
    historicalFlood,
    layers,
    resources,
    retryKey,
    roadClosures,
    seismic,
    waterways,
    weatherMode,
    weatherPoints,
  ]);

  function toggleLayer(layer: keyof LayerVisibility) {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  function weatherButton(mode: WeatherMode, label: string, icon: string) {
    return (
      <button
        type="button"
        aria-pressed={weatherMode === mode}
        className={weatherMode === mode ? "map-layer map-layer-weather is-active" : "map-layer map-layer-weather"}
        onClick={() => setWeatherMode(weatherMode === mode ? "none" : mode)}
        disabled={externalState === "loading" || weatherPoints.length === 0}
      >
        <i>{icon}</i>{label}
      </button>
    );
  }

  return (
    <section className="map-card command-map advanced-map" aria-label="Mapa operativo de VIGÍA">
      <div className="map-toolbar">
        <div>
          <span className="eyebrow">Mapa operativo multicapas</span>
          <strong>{visibleCount} elementos visibles · clima, riesgo y territorio</strong>
        </div>
        <span className={`map-state map-state-${mapState}`}>
          {mapState === "ready" ? "En vivo" : mapState === "error" ? "Mapa no disponible" : "Cargando"}
        </span>
      </div>

      <div className="map-control-groups">
        <div className="map-control-group">
          <span>Operación</span>
          <div>
            <button type="button" aria-pressed={layers.resources} className={layers.resources ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("resources")}><i className="legend-resource" />Recursos</button>
            <button type="button" aria-pressed={layers.hazards} className={layers.hazards ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("hazards")}><i className="legend-hazard" />Riesgo actual</button>
            <button type="button" aria-pressed={layers.closures} className={layers.closures ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("closures")}><i className="legend-closure" />Cierres</button>
          </div>
        </div>

        <div className="map-control-group">
          <span>Atmósfera</span>
          <div>
            {weatherButton("temperature", "Temperatura", "°")}
            {weatherButton("pressure", "Presión", "P")}
            {weatherButton("wind", "Viento", "➤")}
          </div>
        </div>

        <div className="map-control-group">
          <span>Territorio</span>
          <div>
            <button type="button" aria-pressed={layers.waterways} className={layers.waterways ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("waterways")} disabled={externalState === "loading" || waterways.features.length === 0}><i className="legend-waterway" />Corrientes</button>
            <button type="button" aria-pressed={layers.frequentFlood} className={layers.frequentFlood ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("frequentFlood")} disabled={externalState === "loading" || frequentFlood.features.length === 0}><i className="legend-frequent-flood" />Inundación frecuente</button>
            <button type="button" aria-pressed={layers.historicalFlood} className={layers.historicalFlood ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("historicalFlood")} disabled={externalState === "loading" || historicalFlood.features.length === 0}><i className="legend-history" />Historial</button>
            <button type="button" aria-pressed={layers.seismic} className={layers.seismic ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("seismic")} disabled={externalState === "loading" || seismic.features.length === 0}><i className="legend-seismic" />Sismicidad</button>
          </div>
        </div>

        <span className={`map-location-state map-location-${locationState}`}>
          <i /> {locationState === "ready" ? "Tu ubicación activa" : locationState === "pending" ? "Buscando ubicación" : "Ubicación no activada"}
        </span>
      </div>

      <div className="live-map-shell command-map-shell">
        <div ref={mapContainer} className="live-map command-live-map" />
        <div className="map-floating-legend advanced-map-legend" aria-label="Leyenda del mapa">
          <strong>Leyenda activa</strong>
          <span><i className="legend-user" /> Tu ubicación</span>
          {layers.resources ? <span><i className="legend-resource" /> Recurso</span> : null}
          {layers.hazards ? <span><i className="legend-hazard" /> Riesgo actual</span> : null}
          {layers.closures ? <span><i className="legend-closure" /> Cierre vial</span> : null}
          {layers.waterways ? <span><i className="legend-waterway" /> Río, arroyo o canal</span> : null}
          {layers.frequentFlood ? <span><i className="legend-frequent-flood" /> Inundación TR2</span> : null}
          {layers.historicalFlood ? <span><i className="legend-history" /> Reporte histórico</span> : null}
          {layers.seismic ? <span><i className="legend-seismic" /> Densidad sísmica</span> : null}
          {weatherMode !== "none" ? <span><i className={`legend-${weatherMode}`} /> {weatherMode === "temperature" ? "Temperatura" : weatherMode === "pressure" ? "Presión local" : "Viento"}</span> : null}
        </div>

        {selectedResource ? (
          <aside className="map-selection-panel" aria-label="Recurso seleccionado">
            <button type="button" className="map-selection-close" onClick={() => setSelectedResource(null)} aria-label="Cerrar detalle">×</button>
            <span>{categoryLabel[selectedResource.category]}</span>
            <strong>{selectedResource.name}</strong>
            <p>{selectedResource.details}</p>
            <div>
              <b>{statusLabel[selectedResource.status]}</b>
              <small>{selectedDistance !== null ? `${selectedDistance.toFixed(1)} km desde tu posición` : selectedResource.distanceKm > 0 ? `${selectedResource.distanceKm.toFixed(1)} km de referencia` : "Distancia no calculada"}</small>
            </div>
            {selectedResource.latitude !== undefined && selectedResource.longitude !== undefined ? (
              <a href={`https://www.openstreetmap.org/?mlat=${selectedResource.latitude}&mlon=${selectedResource.longitude}#map=16/${selectedResource.latitude}/${selectedResource.longitude}`} target="_blank" rel="noopener noreferrer">Usar como destino</a>
            ) : null}
          </aside>
        ) : null}

        {mapState === "error" ? (
          <div className="map-error-panel" role="alert">
            <strong>No se pudo cargar el mapa base</strong>
            <span>Revisa la conexión o vuelve a intentar. Los recursos siguen disponibles debajo.</span>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)}>Reintentar mapa</button>
          </div>
        ) : null}
      </div>

      <div className="map-footer command-map-footer advanced-map-footer">
        <div>
          <span className="route-step-index">i</span>
          <p><strong>Las capas territoriales muestran contexto, no una orden de evacuación.</strong> Inundación frecuente corresponde a modelación TR2; la sismicidad es densidad histórica regional.</p>
        </div>
        <span className="confidence">Atlas MTY + Open-Meteo + USGS</span>
      </div>
    </section>
  );
}

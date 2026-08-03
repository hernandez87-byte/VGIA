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
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

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

export function RiskMap({ resources, hazardZones, roadClosures }: RiskMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const [locationState, setLocationState] = useState<"pending" | "ready" | "unavailable">("pending");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedResource, setSelectedResource] = useState<ResourcePoint | null>(null);
  const [layers, setLayers] = useState<LayerVisibility>({ resources: true, hazards: true, closures: true });

  const visibleCount = useMemo(
    () =>
      (layers.resources ? resources.length : 0) +
      (layers.hazards ? hazardZones.length : 0) +
      (layers.closures ? roadClosures.length : 0),
    [hazardZones.length, layers, resources.length, roadClosures.length],
  );

  const selectedDistance = useMemo(() => {
    if (
      !selectedResource ||
      !userLocation ||
      typeof selectedResource.latitude !== "number" ||
      typeof selectedResource.longitude !== "number"
    ) {
      return null;
    }
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
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "riskScore"],
              0,
              "#f4b942",
              70,
              "#ef6a4d",
              100,
              "#c92f3d",
            ],
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

      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 72, maxZoom: 13, duration: 0 });

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
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
  }, [hazardZones, layers, resources, retryKey, roadClosures]);

  function toggleLayer(layer: keyof LayerVisibility) {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  return (
    <section className="map-card command-map" aria-label="Mapa operativo de VIGÍA">
      <div className="map-toolbar">
        <div>
          <span className="eyebrow">Mapa operativo</span>
          <strong>{resources.length} recursos · {roadClosures.length} cierres · {hazardZones.length} zonas de riesgo</strong>
        </div>
        <span className={`map-state map-state-${mapState}`}>
          {mapState === "ready" ? `${visibleCount} elementos visibles` : mapState === "error" ? "Mapa no disponible" : "Cargando"}
        </span>
      </div>

      <div className="map-layer-bar" role="group" aria-label="Capas del mapa">
        <button type="button" aria-pressed={layers.resources} className={layers.resources ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("resources")}>
          <i className="legend-resource" /> Recursos
        </button>
        <button type="button" aria-pressed={layers.hazards} className={layers.hazards ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("hazards")}>
          <i className="legend-hazard" /> Riesgo
        </button>
        <button type="button" aria-pressed={layers.closures} className={layers.closures ? "map-layer is-active" : "map-layer"} onClick={() => toggleLayer("closures")}>
          <i className="legend-closure" /> Cierres
        </button>
        <span className={`map-location-state map-location-${locationState}`}>
          <i /> {locationState === "ready" ? "Tu ubicación activa" : locationState === "pending" ? "Buscando ubicación" : "Ubicación no activada"}
        </span>
      </div>

      <div className="live-map-shell command-map-shell">
        <div ref={mapContainer} className="live-map command-live-map" />
        <div className="map-floating-legend" aria-label="Leyenda del mapa">
          <strong>Leyenda</strong>
          <span><i className="legend-user" /> Tu ubicación</span>
          <span><i className="legend-resource" /> Recurso</span>
          <span><i className="legend-hazard" /> Zona de riesgo</span>
          <span><i className="legend-closure" /> Cierre vial</span>
        </div>

        {selectedResource ? (
          <aside className="map-selection-panel" aria-label="Recurso seleccionado">
            <button type="button" className="map-selection-close" onClick={() => setSelectedResource(null)} aria-label="Cerrar detalle">×</button>
            <span>{categoryLabel[selectedResource.category]}</span>
            <strong>{selectedResource.name}</strong>
            <p>{selectedResource.details}</p>
            <div>
              <b>{statusLabel[selectedResource.status]}</b>
              <small>
                {selectedDistance !== null
                  ? `${selectedDistance.toFixed(1)} km desde tu posición`
                  : selectedResource.distanceKm > 0
                    ? `${selectedResource.distanceKm.toFixed(1)} km de referencia`
                    : "Distancia no calculada"}
              </small>
            </div>
            {selectedResource.latitude !== undefined && selectedResource.longitude !== undefined ? (
              <a href={`https://www.openstreetmap.org/?mlat=${selectedResource.latitude}&mlon=${selectedResource.longitude}#map=16/${selectedResource.latitude}/${selectedResource.longitude}`} target="_blank" rel="noopener noreferrer">
                Usar como destino
              </a>
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

      <div className="map-footer command-map-footer">
        <div>
          <span className="route-step-index">!</span>
          <p><strong>Selecciona un punto para revisar disponibilidad y distancia.</strong> La navegación automática permanece desactivada hasta contar con riesgo vial por segmento.</p>
        </div>
        <span className="confidence">PostGIS + MapLibre</span>
      </div>
    </section>
  );
}

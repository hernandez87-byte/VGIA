"use client";

import { useEffect, useRef, useState } from "react";
import {
  GeolocateControl,
  LngLatBounds,
  Map,
  Marker,
  NavigationControl,
  Popup,
  type GeoJSONSourceSpecification,
} from "maplibre-gl";
import type {
  HazardZone,
  ResourcePoint,
  RoadClosure,
} from "@/lib/domain/emergency";

interface RiskMapProps {
  resources: ResourcePoint[];
  hazardZones: HazardZone[];
  roadClosures: RoadClosure[];
}

const DEFAULT_LATITUDE = Number(
  process.env.NEXT_PUBLIC_DEFAULT_LATITUDE ?? "25.6866",
);
const DEFAULT_LONGITUDE = Number(
  process.env.NEXT_PUBLIC_DEFAULT_LONGITUDE ?? "-100.3161",
);
const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  "https://demotiles.maplibre.org/style.json";

const markerSymbol: Record<ResourcePoint["category"], string> = {
  shelter: "⌂",
  water: "◒",
  medical: "+",
  food: "●",
  energy: "ϟ",
  hardware: "◆",
  communications: "⌁",
};

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
    : `Estado: ${resource.status}`;

  wrapper.append(title, details, status);
  return wrapper;
}

export function RiskMap({
  resources,
  hazardZones,
  roadClosures,
}: RiskMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new Map({
      container: mapContainer.current,
      style: MAP_STYLE,
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

    map.on("load", () => {
      const zoneCollection = {
        type: "FeatureCollection" as const,
        features: hazardZones.map((zone) => ({
          type: "Feature" as const,
          properties: {
            id: zone.id,
            riskScore: zone.riskScore,
            expectedDepthM: zone.expectedDepthM ?? null,
          },
          geometry: zone.geometry,
        })),
      };

      const closureCollection = {
        type: "FeatureCollection" as const,
        features: roadClosures.map((closure) => ({
          type: "Feature" as const,
          properties: { id: closure.id, reason: closure.reason },
          geometry: closure.geometry,
        })),
      };

      if (zoneCollection.features.length > 0) {
        map.addSource("vigia-hazard-zones", {
          type: "geojson",
          data: zoneCollection as GeoJSONSourceSpecification["data"],
        });
        map.addLayer({
          id: "vigia-hazard-fill",
          type: "fill",
          source: "vigia-hazard-zones",
          paint: {
            "fill-color": "#e55353",
            "fill-opacity": 0.32,
            "fill-outline-color": "#a82f31",
          },
        });
      }

      if (closureCollection.features.length > 0) {
        map.addSource("vigia-road-closures", {
          type: "geojson",
          data: closureCollection as GeoJSONSourceSpecification["data"],
        });
        map.addLayer({
          id: "vigia-road-closures-line",
          type: "line",
          source: "vigia-road-closures",
          paint: {
            "line-color": "#e55353",
            "line-width": 6,
            "line-dasharray": [1, 1.5],
          },
        });
      }

      const bounds = new LngLatBounds();

      resources.forEach((resource) => {
        if (
          typeof resource.latitude !== "number" ||
          typeof resource.longitude !== "number"
        ) {
          return;
        }

        const element = document.createElement("button");
        element.type = "button";
        element.className = `live-resource-marker marker-${resource.category}`;
        element.textContent = markerSymbol[resource.category];
        element.setAttribute("aria-label", resource.name);

        const marker = new Marker({ element })
          .setLngLat([resource.longitude, resource.latitude])
          .setPopup(
            new Popup({ offset: 18 }).setDOMContent(popupContent(resource)),
          )
          .addTo(map);

        markers.push(marker);
        bounds.extend([resource.longitude, resource.latitude]);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 0 });
      }

      setMapState("ready");
    });

    map.on("error", () => setMapState("error"));

    return () => {
      markers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [hazardZones, resources, roadClosures]);

  return (
    <section className="map-card" aria-label="Mapa operativo de VIGÍA">
      <div className="map-toolbar">
        <div>
          <span className="eyebrow">Mapa operativo</span>
          <strong>
            {resources.length} recursos · {roadClosures.length} cierres ·{" "}
            {hazardZones.length} zonas de riesgo
          </strong>
        </div>
        <span className={`map-state map-state-${mapState}`}>
          {mapState === "ready"
            ? "En vivo"
            : mapState === "error"
              ? "Mapa no disponible"
              : "Cargando"}
        </span>
      </div>

      <div ref={mapContainer} className="live-map" />

      <div className="map-footer">
        <div>
          <span className="route-step-index">!</span>
          <p>
            <strong>Aún no hay navegación automática.</strong> El mapa muestra
            recursos y amenazas verificadas; sigue las instrucciones oficiales.
          </p>
        </div>
        <span className="confidence">PostGIS + MapLibre</span>
      </div>
    </section>
  );
}

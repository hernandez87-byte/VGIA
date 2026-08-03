"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HazardZone, ResourcePoint } from "@/lib/domain/emergency";

interface PersonalLocationSummaryProps {
  hazardZones: HazardZone[];
  resources: ResourcePoint[];
  isSimulation: boolean;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

type LocationState = "loading" | "ready" | "denied" | "unavailable";

function haversineKm(from: Coordinates, to: Coordinates): number {
  const radiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const latitudeA = toRadians(from.latitude);
  const latitudeB = toRadians(to.latitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function pointInsideRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];
    if (!currentPoint || !previousPoint) continue;

    const [currentX, currentY] = currentPoint;
    const [previousX, previousY] = previousPoint;
    const intersects =
      currentY > y !== previousY > y &&
      x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY || Number.EPSILON) + currentX;

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInsidePolygon(point: [number, number], polygon: number[][][]): boolean {
  const outerRing = polygon[0];
  if (!outerRing || !pointInsideRing(point, outerRing)) return false;
  return !polygon.slice(1).some((hole) => pointInsideRing(point, hole));
}

function pointInsideZone(coordinates: Coordinates, zone: HazardZone): boolean {
  const point: [number, number] = [coordinates.longitude, coordinates.latitude];

  if (zone.geometry.type === "Polygon") {
    return pointInsidePolygon(point, zone.geometry.coordinates as number[][][]);
  }

  if (zone.geometry.type === "MultiPolygon") {
    return (zone.geometry.coordinates as number[][][][]).some((polygon) =>
      pointInsidePolygon(point, polygon),
    );
  }

  return false;
}

export function PersonalLocationSummary({
  hazardZones,
  resources,
  isSimulation,
}: PersonalLocationSummaryProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [state, setState] = useState<LocationState>("loading");

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState("unavailable");
      return;
    }

    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setState("ready");
      },
      (error) => {
        setState(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const evaluation = useMemo(() => {
    if (!coordinates) return null;

    const zonesContainingUser = hazardZones.filter((zone) => pointInsideZone(coordinates, zone));
    const nearestResource = resources
      .filter(
        (resource) =>
          (resource.status === "available" || resource.status === "limited") &&
          typeof resource.latitude === "number" &&
          typeof resource.longitude === "number",
      )
      .map((resource) => ({
        resource,
        distanceKm: haversineKm(coordinates, {
          latitude: resource.latitude as number,
          longitude: resource.longitude as number,
        }),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm)[0];

    return {
      insideRiskZone: zonesContainingUser.length > 0,
      highestRiskScore: zonesContainingUser.reduce(
        (highest, zone) => Math.max(highest, zone.riskScore),
        0,
      ),
      nearestResource,
    };
  }, [coordinates, hazardZones, resources]);

  if (state !== "ready" || !evaluation) {
    return (
      <div className="personal-location personal-location-pending">
        <div>
          <span>Ubicación personal</span>
          <strong>
            {state === "loading"
              ? "Calculando tu posición…"
              : state === "denied"
                ? "Permiso de ubicación desactivado"
                : "Ubicación no disponible"}
          </strong>
        </div>
        {state !== "loading" ? (
          <button type="button" onClick={requestLocation}>
            Activar ubicación
          </button>
        ) : (
          <i aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <div
      className={
        evaluation.insideRiskZone
          ? "personal-location personal-location-danger"
          : "personal-location personal-location-clear"
      }
    >
      <div className="personal-location-status">
        <span>Evaluación de tu posición</span>
        <strong>
          {evaluation.insideRiskZone
            ? `Dentro de una zona trazada de riesgo ${evaluation.highestRiskScore}/100`
            : "Fuera de las zonas de riesgo trazadas"}
        </strong>
        <small>
          {isSimulation
            ? "El polígono actual pertenece al escenario demostrativo."
            : "La ausencia de un polígono no confirma que el lugar sea seguro."}
        </small>
      </div>
      <div className="personal-location-resource">
        <span>Recurso disponible más cercano</span>
        <strong>
          {evaluation.nearestResource
            ? evaluation.nearestResource.resource.name
            : "Sin recursos geolocalizados"}
        </strong>
        <small>
          {evaluation.nearestResource
            ? `${evaluation.nearestResource.distanceKm.toFixed(1)} km en línea recta`
            : "No fue posible calcular distancia"}
        </small>
      </div>
    </div>
  );
}

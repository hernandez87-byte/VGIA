"use client";

import { useMemo, useState } from "react";
import type { ResourceCategory, ResourcePoint } from "@/lib/domain/emergency";
import { StatusChip } from "@/components/status-chip";

const categoryLabel: Record<ResourceCategory, string> = {
  shelter: "Refugios",
  water: "Agua",
  medical: "Salud",
  food: "Alimentos",
  energy: "Energía",
  hardware: "Herramientas",
  communications: "Comunicación",
};

const categorySymbol: Record<ResourceCategory, string> = {
  shelter: "⌂",
  water: "◒",
  medical: "+",
  food: "●",
  energy: "ϟ",
  hardware: "◆",
  communications: "⌁",
};

const statusLabel: Record<ResourcePoint["status"], string> = {
  available: "Disponible",
  limited: "Limitado",
  closed: "Cerrado",
  unknown: "Sin confirmar",
};

interface ResourceListProps {
  resources: ResourcePoint[];
}

type ResourceFilter = "all" | ResourceCategory;

function metadataNumber(resource: ResourcePoint, keys: string[]): number | null {
  for (const key of keys) {
    const value = resource.metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function metadataString(resource: ResourcePoint, keys: string[]): string | null {
  for (const key of keys) {
    const value = resource.metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function availabilityPercent(resource: ResourcePoint): number {
  const explicit = metadataNumber(resource, ["availability_percent", "capacity_percent"]);
  if (explicit !== null) return Math.max(0, Math.min(100, explicit));
  if (resource.status === "available") return 82;
  if (resource.status === "limited") return 42;
  if (resource.status === "closed") return 0;
  return 20;
}

export function ResourceList({ resources }: ResourceListProps) {
  const [filter, setFilter] = useState<ResourceFilter>("all");
  const categories = useMemo(
    () => Array.from(new Set(resources.map((resource) => resource.category))),
    [resources],
  );
  const visibleResources = useMemo(
    () => filter === "all" ? resources : resources.filter((resource) => resource.category === filter),
    [filter, resources],
  );
  const containsSimulation = resources.some((resource) => resource.isSimulation);

  return (
    <section className="panel-card resource-panel" id="recursos">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Abastecimiento cercano</span>
          <h2>Recursos operativos</h2>
          <p className="section-description">Disponibilidad, distancia y última confirmación sin convertir cada tarjeta en una factura.</p>
        </div>
        <span className="demo-label">{containsSimulation ? "Datos de demostración" : `${resources.length} visibles`}</span>
      </div>

      <div className="resource-filters" role="group" aria-label="Filtrar recursos">
        <button type="button" className={filter === "all" ? "resource-filter is-active" : "resource-filter"} onClick={() => setFilter("all")}>Todos</button>
        {categories.map((category) => (
          <button type="button" className={filter === category ? "resource-filter is-active" : "resource-filter"} key={category} onClick={() => setFilter(category)}>
            {categoryLabel[category]}
          </button>
        ))}
      </div>

      <div className="resource-list resource-list-rich">
        {visibleResources.length === 0 ? <p className="empty-state">No hay recursos para este filtro.</p> : null}

        {visibleResources.slice(0, 6).map((resource) => {
          const mapUrl =
            resource.latitude !== undefined && resource.longitude !== undefined
              ? `https://www.openstreetmap.org/?mlat=${resource.latitude}&mlon=${resource.longitude}#map=16/${resource.latitude}/${resource.longitude}`
              : null;
          const etaMinutes = resource.distanceKm > 0 ? Math.max(4, Math.round(resource.distanceKm * 4.5)) : null;
          const waitMinutes = metadataNumber(resource, ["wait_minutes", "estimated_wait_minutes"]);
          const capacity = metadataNumber(resource, ["capacity", "capacity_liters", "available_units"]);
          const capacityUnit = metadataString(resource, ["capacity_unit", "unit"]);
          const phone = metadataString(resource, ["phone", "telephone"]);
          const availability = availabilityPercent(resource);

          return (
            <article className={`resource-item resource-item-${resource.category}`} key={resource.id}>
              <div className={`resource-symbol resource-${resource.category}`} aria-hidden="true">{categorySymbol[resource.category]}</div>
              <div className="resource-copy">
                <div className="resource-title-row">
                  <div>
                    <strong>{resource.name}</strong>
                    <span className="resource-kind">{categoryLabel[resource.category]}</span>
                  </div>
                  <StatusChip tone={resource.status === "available" ? "success" : resource.status === "limited" ? "warning" : "neutral"}>
                    {statusLabel[resource.status]}
                  </StatusChip>
                </div>

                <div className="resource-quick-metrics">
                  {resource.distanceKm > 0 ? <span>{resource.distanceKm.toFixed(1)} km</span> : null}
                  {etaMinutes ? <span>≈ {etaMinutes} min</span> : null}
                  <span>{resource.isSimulation ? "Confirmación simulada" : `Hace ${resource.updatedMinutesAgo} min`}</span>
                </div>

                <div className="resource-availability resource-availability-compact">
                  <div><span>Disponibilidad</span><strong>{availability}%</strong></div>
                  <div className="resource-availability-track" aria-label={`Disponibilidad ${availability}%`}><span style={{ width: `${availability}%` }} /></div>
                </div>

                <div className="resource-primary-actions">
                  {phone ? <a href={`tel:${phone}`}>Llamar</a> : null}
                  {mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer">Cómo llegar</a> : <a href="#mapa-operativo">Ver en mapa</a>}
                </div>

                <details className="resource-details">
                  <summary>Ver detalles</summary>
                  <p>{resource.details || "Sin detalles adicionales."}</p>
                  <small>
                    {waitMinutes !== null ? `Espera estimada: ${Math.round(waitMinutes)} min. ` : ""}
                    {capacity !== null ? `Capacidad: ${Math.round(capacity).toLocaleString("es-MX")} ${capacityUnit ?? "unidades"}.` : "Capacidad no confirmada."}
                  </small>
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

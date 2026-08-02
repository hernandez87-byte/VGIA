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

export function ResourceList({ resources }: ResourceListProps) {
  const [filter, setFilter] = useState<ResourceFilter>("all");
  const categories = useMemo(
    () => Array.from(new Set(resources.map((resource) => resource.category))),
    [resources],
  );
  const visibleResources = useMemo(
    () =>
      filter === "all"
        ? resources
        : resources.filter((resource) => resource.category === filter),
    [filter, resources],
  );
  const containsSimulation = resources.some((resource) => resource.isSimulation);

  return (
    <section className="panel-card resource-panel" id="recursos">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Abastecimiento cercano</span>
          <h2>Recursos operativos</h2>
          <p className="section-description">
            Disponibilidad, distancia y última confirmación en un solo lugar.
          </p>
        </div>
        <span className="demo-label">
          {containsSimulation ? "Datos de demostración" : `${resources.length} visibles`}
        </span>
      </div>

      <div className="resource-filters" role="group" aria-label="Filtrar recursos">
        <button
          type="button"
          className={filter === "all" ? "resource-filter is-active" : "resource-filter"}
          onClick={() => setFilter("all")}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            type="button"
            className={filter === category ? "resource-filter is-active" : "resource-filter"}
            key={category}
            onClick={() => setFilter(category)}
          >
            {categoryLabel[category]}
          </button>
        ))}
      </div>

      <div className="resource-list">
        {visibleResources.length === 0 ? (
          <p className="empty-state">No hay recursos para este filtro.</p>
        ) : null}

        {visibleResources.slice(0, 6).map((resource) => {
          const mapUrl =
            resource.latitude !== undefined && resource.longitude !== undefined
              ? `https://www.openstreetmap.org/?mlat=${resource.latitude}&mlon=${resource.longitude}#map=16/${resource.latitude}/${resource.longitude}`
              : null;

          return (
            <article className="resource-item" key={resource.id}>
              <div
                className={`resource-symbol resource-${resource.category}`}
                aria-hidden="true"
              >
                {categorySymbol[resource.category]}
              </div>
              <div className="resource-copy">
                <div className="resource-title-row">
                  <strong>{resource.name}</strong>
                  <StatusChip
                    tone={
                      resource.status === "available"
                        ? "success"
                        : resource.status === "limited"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {statusLabel[resource.status]}
                  </StatusChip>
                </div>
                <span className="resource-distance">
                  {categoryLabel[resource.category]}
                  {resource.distanceKm > 0 ? ` · ${resource.distanceKm.toFixed(1)} km` : ""}
                </span>
                <p>{resource.details || "Sin detalles adicionales."}</p>
                <div className="resource-footer">
                  <small>
                    {resource.isSimulation
                      ? "Disponibilidad simulada"
                      : `Confirmado hace ${resource.updatedMinutesAgo} min`}
                  </small>
                  <div className="resource-actions">
                    {mapUrl ? (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                        Abrir ubicación
                      </a>
                    ) : null}
                    <a href="#mapa-operativo">Ver en el mapa</a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

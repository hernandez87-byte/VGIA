import type { ResourcePoint } from "@/lib/domain/emergency";
import { StatusChip } from "@/components/status-chip";

const categoryLabel: Record<ResourcePoint["category"], string> = {
  shelter: "Refugio",
  water: "Agua",
  medical: "Salud",
  food: "Alimentos",
  energy: "Energía",
  hardware: "Herramientas",
  communications: "Comunicación",
};

const categorySymbol: Record<ResourcePoint["category"], string> = {
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

export function ResourceList({ resources }: ResourceListProps) {
  return (
    <section className="panel-card resource-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Abastecimiento</span>
          <h2>Recursos operativos</h2>
        </div>
        <span className="demo-label">{resources.length} visibles</span>
      </div>

      <div className="resource-list">
        {resources.length === 0 ? (
          <p className="empty-state">
            No hay recursos públicos verificados en este momento.
          </p>
        ) : null}

        {resources.slice(0, 6).map((resource) => (
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
              <span>
                {categoryLabel[resource.category]}
                {resource.distanceKm > 0
                  ? ` · ${resource.distanceKm.toFixed(1)} km`
                  : ""}
              </span>
              <p>{resource.details || "Sin detalles adicionales."}</p>
              <small>
                {resource.isSimulation
                  ? "Dato de demostración"
                  : `Confirmado hace ${resource.updatedMinutesAgo} min`}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

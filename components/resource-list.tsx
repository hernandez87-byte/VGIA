import type { ResourcePoint } from "@/lib/domain/emergency";
import { StatusChip } from "@/components/status-chip";

const categoryLabel: Record<ResourcePoint["category"], string> = {
  shelter: "Refugio",
  water: "Agua",
  medical: "Salud",
  food: "Alimentos",
  energy: "Energía",
  hardware: "Herramientas",
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
        <button type="button" className="text-button">Ver todos</button>
      </div>

      <div className="resource-list">
        {resources.map((resource) => (
          <article className="resource-item" key={resource.id}>
            <div className={`resource-symbol resource-${resource.category}`} aria-hidden="true">
              {resource.category === "shelter" ? "⌂" : resource.category === "medical" ? "+" : "◒"}
            </div>
            <div className="resource-copy">
              <div className="resource-title-row">
                <strong>{resource.name}</strong>
                <StatusChip tone={resource.status === "available" ? "success" : "warning"}>
                  {resource.status === "available" ? "Disponible" : "Limitado"}
                </StatusChip>
              </div>
              <span>{categoryLabel[resource.category]} · {resource.distanceKm} km</span>
              <p>{resource.details}</p>
              <small>Confirmado hace {resource.updatedMinutesAgo} min</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
